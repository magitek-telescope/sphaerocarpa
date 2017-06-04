import Vue from 'vue/dist/vue';
import Vuex from 'vuex';
import * as types from '../mutation-types';
Vue.use(Vuex);
import {createClient} from 'then-redis';

const state = {
  hosts: []
}

const getters = {
  hosts: state => state.hosts
}

const mutations = {
  [types.HOSTS_CLEAR_HOSTS](state, data){
    state.hosts = [];
  },

  [types.HOSTS_ADD_HOST](state, data){
    state.hosts.push(data);
  },

  [types.HOSTS_SAVE_STORAGE](state){
    localStorage.setItem("hosts", JSON.stringify(state.hosts));
  },

  [types.HOSTS_REMOVE_HOST](state, index){
    state.hosts = state.hosts.filter((_,i)=>i!=index);
  }
}

const actions = {
  initialize(ctx){
    ctx.commit(types.HOSTS_CLEAR_HOSTS);
    JSON.parse(localStorage.getItem("hosts")||"[]").forEach((host)=>{
      ctx.commit(types.HOSTS_ADD_HOST, host);
    })
  },

  add(ctx, data){
    ctx.commit(types.HOSTS_ADD_HOST, data);
    ctx.commit(types.HOSTS_SAVE_STORAGE);
  },

  remove(ctx, index){
    ctx.commit(types.HOSTS_REMOVE_HOST, index);
    ctx.commit(types.HOSTS_SAVE_STORAGE);
  }
}

export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations
});
