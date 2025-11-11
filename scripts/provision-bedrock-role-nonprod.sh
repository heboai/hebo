#!/usr/bin/env bash

set -euo pipefail

readonly ROOT_AWS_ACCOUNT_ID="160885286799"
readonly INLINE_POLICY_NAME="HeboBedrockPolicy4CrossAccountAssumption"

usage() {
  cat <<'EOF'
Usage: provision-bedrock-role-nonprod.sh [options]

Provision or update the Hebo Bedrock cross-account IAM role for non-production environments.
The trust relationship allows any role from the root AWS account to assume the role, which is
useful for shared dev/preview stages.

Optional flags:
  --stage <stage>                Stage name to prefix the IAM role (default: preview).
  --role-name <name>             Explicit IAM role name (overrides --stage).
  --region <region>              AWS region for API calls (default: us-east-1).
  --profile <profile>            AWS CLI profile to use.
  --help                         Show this message and exit.

Example:
  ./provision-bedrock-role-nonprod.sh --stage dev
EOF
}

main() {
  local stage="preview"
  local role_name=""
  local aws_region="us-east-1"
  local aws_profile=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --stage)
        stage="$2"
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

  if [[ -z "$role_name" ]]; then
    role_name="${stage}-hebo-bedrock-role-4-cross-account-assumption"
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
        "AWS": "arn:aws:iam::${ROOT_AWS_ACCOUNT_ID}:root"
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
      --description "Allows Hebo gateway (non-prod) to invoke Bedrock foundation models." \
      --assume-role-policy-document "file://$trust_policy_file"
  fi

  echo "Applying inline Bedrock access policy..."
  aws "${aws_cli_opts[@]}" iam put-role-policy \
    --role-name "$role_name" \
    --policy-name "$INLINE_POLICY_NAME" \
    --policy-document "file://$inline_policy_file"

  echo "Provisioning complete. IAM role ${role_name} is ready for non-production use."
}

main "$@"

