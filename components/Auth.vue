<template>
  <div id="firebaseui-auth-container" />
</template>

<script>
import config from '@/firebase.config'
export default {
  mounted() {
    const firebase = require('firebase')
    const firebaseui = require('firebaseui')

    firebase.initializeApp(config)

    const ui = new firebaseui.auth.AuthUI(firebase.auth())

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        ui.reset()
      } else {
        // No user is signed in.

        const uiConfig = {
          // signInSuccessUrl: '/',
          callbacks: {
            signInSuccessWithAuthResult: (_) => {
              return false
            },
            signInFailure: (error) => {
              return error
            }
          },
          signInOptions: [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            firebase.auth.EmailAuthProvider.PROVIDER_ID
          ]
        }
        ui.start('#firebaseui-auth-container', uiConfig)
      }
    })
  }
}
</script>
