/
 * Amplify Setup and Configuration
 * This file initializes AWS Amplify with the appropriate configuration
 */

import { Amplify } from 'aws-amplify';
import { awsConfig } from './aws-config';

// Configure Amplify with proper structure
const amplifyConfiguration = {
  Auth: {
    Cognito: {
      userPoolId: awsConfig.userPoolId,
      userPoolClientId: awsConfig.userPoolWebClientId,
      region: awsConfig.region,
    }
  }
};

Amplify.configure(amplifyConfiguration);

console.log('AWS Amplify configured with:', {
  region: awsConfig.region,
  userPoolId: awsConfig.userPoolId,
  userPoolClientId: awsConfig.userPoolWebClientId,
});

export default Amplify;