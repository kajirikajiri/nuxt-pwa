import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'

@Module({
  name: 'auth',
  stateFactory: true,
  namespaced: true
})

export default class Auth extends VuexModule {
  isLogin: Boolean = false

  @Action
  logout({commit}: any) {
    const firebase = require('firebase')
    firebase
      .auth()
      .signOut()
      .then()

    commit('remove')
  }

  @Mutation
  set(isLogin: Boolean) {
    this.isLogin = isLogin
  }
}
