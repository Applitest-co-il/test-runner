const { SecretsClient, CognitoClient } = require('@danielyaghil/aws-helpers');

let savedToken = null;

async function getIntraComToken(renew = false) {
    try {
        if (!renew & savedToken) {
            return savedToken;
        }

        let cognitoConf = await SecretsClient.instance().get('applitest/Cognito');
        if (!cognitoConf) {
            console.error('Cognito configuration not found');
            return null;
        }

        let tokens = await CognitoClient.instance().getTokenFromClientCredentials(
            cognitoConf.clientIdIntra,
            cognitoConf.clientSecretIntra,
            cognitoConf.scopeIntra,
            cognitoConf.domain
        );
        savedToken = tokens.access_token;
        return savedToken;
    } catch (error) {
        console.error('Error retrieving token:', error);
        return null;
    }
}

module.exports = {
    getIntraComToken
};
