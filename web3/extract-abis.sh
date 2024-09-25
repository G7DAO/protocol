#!/bin/bash

# Define the directories
ARTIFACTS_DIR="./artifacts/contracts"
OUTPUT_DIR="./abis"

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Loop through all JSON files in the artifacts directory, excluding .dbg.json files
find "$ARTIFACTS_DIR" -type f -name "*.json" ! -name "*.dbg.json" | while read -r file; do
    # Extract the contract name from the file path
    contract_name=$(basename "$file" .json)

    # Extract the ABI using jq and save it to a new file
    jq '.abi' "$file" > "$OUTPUT_DIR/$contract_name.abi.json"

    echo "Extracted ABI for $contract_name"
done

echo "All ABIs have been extracted to the $OUTPUT_DIR directory."