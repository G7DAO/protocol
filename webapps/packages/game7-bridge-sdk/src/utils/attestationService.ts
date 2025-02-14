
export const IRIS_ATTESTATION_API_URL = 'https://iris-api-sandbox.circle.com'

export enum AttestationStatus {
    complete = 'complete',
    pending_confirmations = 'pending_confirmations',
}

export interface AttestationResponse {
    attestation: string | null
    status: AttestationStatus
}
export interface Attestation {
    message: string | null
    status: AttestationStatus
}

const mapAttestation = (attestationResponse: AttestationResponse) => ({
    message: attestationResponse.attestation,
    status: attestationResponse.status,
})

const baseURL = `${IRIS_ATTESTATION_API_URL}/attestations`;

export const getAttestation = async (
    messageHash: string
): Promise<Attestation | null> => {
    try {
        const response = await fetch(`${baseURL}/${messageHash}`);

        if (!response.ok) {
            // Treat 404 as pending and keep polling
            if (response.status === 404) {
                const response = {
                    attestation: null,
                    status: AttestationStatus.pending_confirmations,
                };
                return mapAttestation(response);
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data: AttestationResponse = await response.json();
        return mapAttestation(data);
    } catch (error) {
        console.error(error);
        return null;
    }
};
