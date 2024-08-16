export const formatAddress = (address: string): JSX.Element => {
    const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(address).then(() => {
            alert('Address copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy address: ', err);
        });
    };

    return (
        <a onClick={handleCopy}
            style={{
                textDecoration: "underline",
                color: 'blue',
                cursor: 'pointer'
            }}>
            {shortenedAddress}
        </a>
    );
}
