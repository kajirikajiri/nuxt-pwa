<template>
  <div id="firebaseui-auth-container"></div>
</template>

<script>
export default {
  mounted() {
    const firebase = require('firebase')
    const firebaseui = require('firebaseui')

    const config = {
      apiKey: 'AIzaSyDmijkdEF3I_B16GMQtxWnYBHR7PiCKA7M',
      authDomain: 'nuxt-pwa-3caaf.firebaseapp.com',
      databaseURL: 'https://nuxt-pwa-3caaf.firebaseio.com',
      projectId: 'nuxt-pwa-3caaf',
      storageBucket: 'nuxt-pwa-3caaf.appspot.com',
      messagingSenderId: '214336879934',
      appId: '1:214336879934:web:a724a8a8196d01afa8406f',
      measurementId: 'G-SX36KZN4WC'
    }

    firebase.initializeApp(config)

    const uiConfig = {
      signInSuccessUrl: '/',
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ]
    }
    const ui = new firebaseui.auth.AuthUI(firebase.auth())
    ui.start('#firebaseui-auth-container', uiConfig)
  }
}
</script>
