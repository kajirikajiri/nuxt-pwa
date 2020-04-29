<template>
  <client-only>
    <div id="firebaseui-auth-container" />
  </client-only>
</template>

<script>
import config from '@/firebase.config'
import { authStore } from '~/store'
export default {
  mounted() {
    const firebase = require('firebase/app')
    const firebaseui = require('firebaseui')

    if (!firebase.apps.length) {
      firebase.initializeApp(config)
    }

    const ui =
      firebaseui.auth.AuthUI.getInstance() ||
      new firebaseui.auth.AuthUI(firebase.auth())
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        ui.reset()
        authStore.set(!!user)
      } else {
        // No user is signed in.
        const uiconfig = {
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
        ui.start('#firebaseui-auth-container', uiconfig)
        authStore.set(!!user)
      }
    })
  }
}
</script>
