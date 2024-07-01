# Game7 Accounts

This checklist describes how to manage Game7 accounts

## Environment variables

- [ ] `export KEY_OUTPUT=<path to output keyfile>`
- [ ] `export PASSWORD=<password for keyfile>`
- [ ] `export PRIVATE_KEY=<private key>`

## Generate keyfile

- [ ] Generates a keyfile from a private key

```bash
bin/game7 accounts keyfile \
    --private-key $PRIVATE_KEY \
    --password $PASSWORD \
    --output $KEY_OUTPUT
```

Output: Address: $ADDRESS