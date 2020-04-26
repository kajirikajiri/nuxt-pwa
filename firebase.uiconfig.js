const firebase = require('firebase')
export default {
  callbacks: {
    signInSuccessWithAuthResult: () => {
      return false
    }
  },
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  signInFlow: 'popup'
}
