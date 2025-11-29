#!/bin/bash

# Create TLS secret for node-learn application
# 
# Usage:
#   Run this script: ./k8s/create-tls-secret.sh

# Certificate files location
CERT_DIR="$HOME/Downloads/SSL_all"
SSL_CERT="$CERT_DIR/SSLcertificate.crt"
INTERMEDIATE_CERT="$CERT_DIR/SSLIntermediateCertificate.crt"
PRIVATE_KEY="$CERT_DIR/SSLprivatekey.key"
FULLCHAIN="/tmp/fullchain.pem"

# Check if certificate files exist
if [ ! -f "$SSL_CERT" ]; then
    echo "Error: Certificate file not found at $SSL_CERT"
    exit 1
fi

if [ ! -f "$INTERMEDIATE_CERT" ]; then
    echo "Error: Intermediate certificate not found at $INTERMEDIATE_CERT"
    exit 1
fi

if [ ! -f "$PRIVATE_KEY" ]; then
    echo "Error: Private key file not found at $PRIVATE_KEY"
    exit 1
fi

# Combine certificate and intermediate certificate into fullchain
echo "Creating fullchain certificate..."
cat "$SSL_CERT" "$INTERMEDIATE_CERT" > "$FULLCHAIN"

# Create the TLS secret
echo "Creating Kubernetes TLS secret..."
kubectl create secret tls qnap-tls \
  --cert="$FULLCHAIN" \
  --key="$PRIVATE_KEY" \
  -n node-learn \
  --dry-run=client -o yaml | kubectl apply -f -

# Clean up temporary file
rm "$FULLCHAIN"

echo "TLS secret 'qnap-tls' created successfully!"
