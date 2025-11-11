#!/usr/bin/env bash

set -euo pipefail

readonly DEFAULT_SERVICE_ACCOUNT_ID="google-vertex-service-account"
readonly DEFAULT_WORKLOAD_IDENTITY_POOL_ID="vertex-aws-pool"
readonly DEFAULT_PROVIDER_ID="google-vertex-aws-provider"
readonly AWS_ACCOUNT_ID="160885286799"

usage() {
  cat <<'EOF'
Usage: provision-vertex-provider-prod.sh --project-id <gcp-project-id> --gateway-task-role-arn <arn> [options]

Provision or update the Google Cloud resources required for Hebo's Vertex provider integration in production.

Required flags:
  --project-id <id>             Target Google Cloud project ID.
  --gateway-task-role-arn <arn> ARN of the Hebo gateway ECS task role that should be permitted to federate.

Optional flags:
  --service-account-id <id>     Override the workload identity service account ID (default: google-vertex-service-account).
  --workload-identity-pool-id <id>
                                Override the workload identity pool ID (default: vertex-aws-pool).
  --provider-id <id>            Override the AWS provider ID within the workload identity pool (default: google-vertex-aws-provider).
  --location <location>         Workload identity pool location (default: global).
  --help                        Show this message and exit.

Example:
  ./provision-vertex-provider-prod.sh \\
    --project-id hebo-production \\
    --gateway-task-role-arn arn:aws:iam::160885286799:role/HeboGatewayTaskRole
EOF
}

main() {
  local project_id=""
  local gateway_task_role_arn=""
  local service_account_id="$DEFAULT_SERVICE_ACCOUNT_ID"
  local workload_identity_pool_id="$DEFAULT_WORKLOAD_IDENTITY_POOL_ID"
  local provider_id="$DEFAULT_PROVIDER_ID"
  local location="global"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --project-id)
        project_id="$2"
        shift 2
        ;;
      --gateway-task-role-arn)
        gateway_task_role_arn="$2"
        shift 2
        ;;
      --service-account-id)
        service_account_id="$2"
        shift 2
        ;;
      --workload-identity-pool-id)
        workload_identity_pool_id="$2"
        shift 2
        ;;
      --provider-id)
        provider_id="$2"
        shift 2
        ;;
      --location)
        location="$2"
        shift 2
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        echo "Unknown argument: $1" >&2
        usage
        exit 1
        ;;
    esac
  done

  if [[ -z "$project_id" || -z "$gateway_task_role_arn" ]]; then
    echo "Error: --project-id and --gateway-task-role-arn are required." >&2
    usage
    exit 1
  fi

  if ! command -v gcloud >/dev/null 2>&1; then
    echo "Error: gcloud CLI not found. Install it from https://cloud.google.com/sdk/docs/install." >&2
    exit 1
  fi

  local service_account_email="${service_account_id}@${project_id}.iam.gserviceaccount.com"
  local attribute_mapping="google.subject=assertion.arn,attribute.aws_role=assertion.arn.extract('assumed-role/{role}/'),attribute.account=assertion.account"
  local attribute_condition="assertion.arn.startsWith('${gateway_task_role_arn}')"

  echo "Ensuring service account ${service_account_email} exists..."
  if ! gcloud iam service-accounts describe "$service_account_email" --project="$project_id" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$service_account_id" \
      --project="$project_id" \
      --display-name="Service account for Google Vertex"
  else
    echo "Service account already present."
  fi

  echo "Ensuring workload identity pool ${workload_identity_pool_id} exists..."
  if ! gcloud iam workload-identity-pools describe "$workload_identity_pool_id" --project="$project_id" --location="$location" >/dev/null 2>&1; then
    gcloud iam workload-identity-pools create "$workload_identity_pool_id" \
      --project="$project_id" \
      --location="$location" \
      --display-name="Vertex AWS pool" \
      --description="Pool for Google Vertex → AWS federation"
  else
    echo "Workload identity pool already present."
  fi

  echo "Ensuring workload identity pool provider ${provider_id} exists..."
  if ! gcloud iam workload-identity-pools providers describe "$provider_id" --project="$project_id" --location="$location" --workload-identity-pool="$workload_identity_pool_id" >/dev/null 2>&1; then
    gcloud iam workload-identity-pools providers create-aws "$provider_id" \
      --project="$project_id" \
      --location="$location" \
      --workload-identity-pool="$workload_identity_pool_id" \
      --display-name="Google Vertex AWS provider" \
      --description="Provider for Google Vertex → AWS federation" \
      --account-id="$AWS_ACCOUNT_ID" \
      --attribute-mapping="$attribute_mapping" \
      --attribute-condition="$attribute_condition"
  else
    echo "Provider already present; updating attribute condition..."
    gcloud iam workload-identity-pools providers update-aws "$provider_id" \
      --project="$project_id" \
      --location="$location" \
      --workload-identity-pool="$workload_identity_pool_id" \
      --attribute-mapping="$attribute_mapping" \
      --attribute-condition="$attribute_condition"
  fi

  echo "Binding workload identity user role to service account..."
  local pool_full_name
  pool_full_name="$(gcloud iam workload-identity-pools describe "$workload_identity_pool_id" --project="$project_id" --location="$location" --format="value(name)")"
  local member="principalSet://iam.googleapis.com/${pool_full_name}/attribute.aws_role/${gateway_task_role_arn}"

  gcloud iam service-accounts add-iam-policy-binding "$service_account_email" \
    --project="$project_id" \
    --role="roles/iam.workloadIdentityUser" \
    --member="$member" >/dev/null

  echo "Provisioning complete. Service account ${service_account_email} is configured for Vertex."
}

main "$@"

