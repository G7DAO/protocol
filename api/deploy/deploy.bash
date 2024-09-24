#!/usr/bin/env bash

# Deployment script

# Colors
C_RESET='\033[0m'
C_RED='\033[1;31m'
C_GREEN='\033[1;32m'
C_YELLOW='\033[1;33m'

# Logs
PREFIX_INFO="${C_GREEN}[INFO]${C_RESET} [$(date +%d-%m\ %T)]"
PREFIX_WARN="${C_YELLOW}[WARN]${C_RESET} [$(date +%d-%m\ %T)]"
PREFIX_CRIT="${C_RED}[CRIT]${C_RESET} [$(date +%d-%m\ %T)]"

# Main
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
REPO_DIR="${REPO_DIR:-/home/ubuntu/protocol}"
APP_DIR="${REPO_DIR}/apis/protocol-api"
SECRETS_DIR="${SECRETS_DIR:-/home/ubuntu/protocol-secrets}"
PARAMETERS_ENV_PATH="${SECRETS_DIR}/app-protocol-api.env"
SCRIPT_DIR="$(realpath $(dirname $0))"
USER_SYSTEMD_DIR="${USER_SYSTEMD_DIR:-/home/ubuntu/.config/systemd/user}"

# Service file
PROTOCOL_API_SERVICE_FILE="protocol-api.service"

set -eu

echo
echo
echo -e "${PREFIX_INFO} Source nvm"
. /home/ubuntu/.nvm/nvm.sh

echo
echo
echo -e "${PREFIX_INFO} Installing Node.js dependencies"
EXEC_DIR=$(pwd)
cd "${APP_DIR}"
/home/ubuntu/.nvm/versions/node/v20.14.0/bin/npm install
cd "${EXEC_DIR}"

echo
echo
echo -e "${PREFIX_INFO} Build protocol API server"
EXEC_DIR=$(pwd)
cd "${APP_DIR}"
/home/ubuntu/.nvm/versions/node/v20.14.0/bin/npm run build
cd "${EXEC_DIR}"

echo
echo
echo -e "${PREFIX_INFO} Install checkenv"
HOME=/home/ubuntu /usr/local/go/bin/go install github.com/bugout-dev/checkenv@latest

if [ ! -d "${SECRETS_DIR}" ]; then
  mkdir "${SECRETS_DIR}"
  echo -e "${PREFIX_WARN} Created new secrets directory"
fi

echo
echo
echo -e "${PREFIX_INFO} Add instance local IP and AWS region to parameters"
echo "AWS_LOCAL_IPV4=$(ec2metadata --local-ipv4)" > "${PARAMETERS_ENV_PATH}"
echo "AWS_REGION=${AWS_DEFAULT_REGION}" >> "${PARAMETERS_ENV_PATH}"

echo
echo
echo -e "${PREFIX_INFO} Retrieving deployment parameters"
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION}" /home/ubuntu/go/bin/checkenv show aws_ssm+protocol-api:true > "${PARAMETERS_ENV_PATH}"
chmod 0640 "${PARAMETERS_ENV_PATH}"

echo
echo
echo -e "${PREFIX_INFO} Retrieving deployment secrets"
SECRETS_LIST=$(AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION}" aws secretsmanager list-secrets --filters Key="tag-key",Values="protocol-api" Key="tag-value",Values="true" --output text --query SecretList[*].Name)

for s in $SECRETS_LIST; do
  secret_value=$(AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION}" aws secretsmanager get-secret-value --output text --query SecretString --secret-id $s)
  echo "${s}=${secret_value}" >> "${PARAMETERS_ENV_PATH}"
done

echo
echo
echo -e "${PREFIX_INFO} Remove prefixes in parameters"
while IFS= read -r line; do
  if [[ -z "$line" ]]; then
    continue
  fi

  UPDATED_LINE=$(echo "$line" | sed 's|^/wb/||; s|^wb/||')
  echo "$UPDATED_LINE" >> "${PARAMETERS_ENV_PATH}.updated"
done < "${PARAMETERS_ENV_PATH}"

mv "${PARAMETERS_ENV_PATH}.updated" "${PARAMETERS_ENV_PATH}"
chmod 0640 "${PARAMETERS_ENV_PATH}"

echo
echo
echo -e "${PREFIX_INFO} Prepare user systemd directory"
if [ ! -d "${USER_SYSTEMD_DIR}" ]; then
  mkdir -p "${USER_SYSTEMD_DIR}"
  echo -e "${PREFIX_WARN} Created new user systemd directory"
fi

echo
echo
echo -e "${PREFIX_INFO} Replacing existing protocol API service definition with ${PROTOCOL_API_SERVICE_FILE}"
chmod 644 "${SCRIPT_DIR}/${PROTOCOL_API_SERVICE_FILE}"
cp "${SCRIPT_DIR}/${PROTOCOL_API_SERVICE_FILE}" "${USER_SYSTEMD_DIR}/${PROTOCOL_API_SERVICE_FILE}"
XDG_RUNTIME_DIR="/run/user/1000" systemctl --user daemon-reload
XDG_RUNTIME_DIR="/run/user/1000" systemctl --user restart "${PROTOCOL_API_SERVICE_FILE}"
