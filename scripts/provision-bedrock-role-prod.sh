#!/usr/bin/env bash

set -euo pipefail

readonly DEFAULT_ROLE_NAME="production-hebo-bedrock-role-4-cross-account-assumption"
readonly INLINE_POLICY_NAME="HeboBedrockPolicy4CrossAccountAssumption"

usage() {
  cat <<'EOF'
Usage: provision-bedrock-role-prod.sh --gateway-task-role-arn <arn> [options]

Provision or update the Hebo Bedrock cross-account IAM role for production.

Required flags:
  --gateway-task-role-arn <arn>  ARN of the Hebo gateway ECS task role allowed to assume this role.

Optional flags:
  --role-name <name>             Override the IAM role name (default: production-hebo-bedrock-role-4-cross-account-assumption).
  --region <region>              AWS region for API calls (default: us-east-1).
  --profile <profile>            AWS CLI profile name to use.
  --help                         Show this message and exit.

Example:
  ./provision-bedrock-role-prod.sh \\
    --gateway-task-role-arn arn:aws:iam::160885286799:role/HeboGatewayTaskRole
EOF
}

main() {
  local gateway_task_role_arn=""
  local role_name="$DEFAULT_ROLE_NAME"
  local aws_region="us-east-1"
  local aws_profile=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --gateway-task-role-arn)
        gateway_task_role_arn="$2"
        shift 2
        ;;
      --role-name)
        role_name="$2"
        shift 2
        ;;
      --region)
        aws_region="$2"
        shift 2
        ;;
      --profile)
        aws_profile="$2"
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

  if [[ -z "$gateway_task_role_arn" ]]; then
    echo "Error: --gateway-task-role-arn is required." >&2
    usage
    exit 1
  fi

  if ! command -v aws >/dev/null 2>&1; then
    echo "Error: aws CLI not found. Install it from https://aws.amazon.com/cli/." >&2
    exit 1
  fi

  local -a aws_cli_opts
  aws_cli_opts=("--region" "$aws_region")
  if [[ -n "$aws_profile" ]]; then
    aws_cli_opts+=("--profile" "$aws_profile")
  fi

  local trust_policy_file
  local inline_policy_file
  trust_policy_file="$(mktemp)"
  inline_policy_file="$(mktemp)"
  trap 'rm -f "$trust_policy_file" "$inline_policy_file"' EXIT

  cat >"$trust_policy_file" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "${gateway_task_role_arn}"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  cat >"$inline_policy_file" <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    }
  ]
}
EOF

  if aws "${aws_cli_opts[@]}" iam get-role --role-name "$role_name" >/dev/null 2>&1; then
    echo "Updating trust policy for existing role ${role_name}..."
    aws "${aws_cli_opts[@]}" iam update-assume-role-policy \
      --role-name "$role_name" \
      --policy-document "file://$trust_policy_file"
  else
    echo "Creating IAM role ${role_name}..."
    aws "${aws_cli_opts[@]}" iam create-role \
      --role-name "$role_name" \
      --description "Allows Hebo gateway to invoke Bedrock foundation models." \
      --assume-role-policy-document "file://$trust_policy_file"
  fi

  echo "Applying inline Bedrock access policy..."
  aws "${aws_cli_opts[@]}" iam put-role-policy \
    --role-name "$role_name" \
    --policy-name "$INLINE_POLICY_NAME" \
    --policy-document "file://$inline_policy_file"

  echo "Provisioning complete. IAM role ${role_name} is ready for use."
}

main "$@"

