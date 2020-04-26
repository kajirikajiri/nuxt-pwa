<template>
  <div>
    <div id="firebaseui-auth-container" />
  </div>
</template>

<script>
import config from '@/firebase.config'
import uiconfig from '@/firebase.uiconfig'
import { authStore } from '~/store'
export default {
  mounted() {
    const firebase = require('firebase')
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
        ui.start('#firebaseui-auth-container', uiconfig)
        authStore.set(!!user)
      }
    })
  }
}
</script>
