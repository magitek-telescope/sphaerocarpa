<template>
  <div id="app">
    <header class="toolbar toolbar-header">
      <h1 class="title" style="padding:4px;display:flex;align-items:center;justify-content:center;">
        <img src="redis.png" width="15" style="margin-right:5px"> Sphaerocarpa
      </h1>
      <div class="toolbar-actions">

        <div class="btn-group pull-right">
          <router-link active-class="active" to="/list" tag="button" class="btn btn-large btn-default" tabindex="1">
            <span class="icon icon-list"></span>
          </router-link>
          <router-link active-class="active" to="/console" tag="button" class="btn btn-large btn-default" tabindex="2">
            <span>&gt;_</span>
          </router-link>
          <button class="btn btn-large btn-default" tabindex="3" v-on:click="closeServer">
            <span class="icon icon-logout"></span>
          </button>
        </div>

        <div class="pull-right" style="margin-right:5px;">
          <input class="form-control" type="text" placeholder="Search" style="padding: 4px 10px;" v-model="form.search">
        </div>
      </div>
    </header>

    <!--
    WORK IN PROGRESS
    <div class="tab-group default-hide" v-cloak v-if="getServers.length">

      <div :class="'tab-item'+(checkIsActive(server)?' active':'')" v-for="server in getServers" v-on:click="selectServer(server)">
        <span class="icon icon-cancel icon-close-tab" v-on:click.prevent="closeServer($event, server)"></span>
        {{server.host.host}}:{{server.host.port}}
      </div>

      <div :class="'tab-item tab-item-fixed'+(getSelectedId == undefined?' active':'')" v-on:click="addHost">
        <span class="icon icon-plus"></span>
      </div>
    </div>
    -->

    <router-view :data="redisData"></router-view>

    <footer class="toolbar toolbar-footer" style="padding:5px 10px;">
      <h1 class="title" v-cloak>
        <span class="pull-left"  v-if="getActiveServer">{{getActiveServer.host.host}}:{{getActiveServer.host.port}}</span>
        <span class="pull-right" v-if="getActiveServer">{{redisData.length}} keys</span>
      </h1>
    </footer>
  </div>
</template>

<script>
import store from './store';

export default {
  data(){
    return {
      isSelectedClose: false,
      form: {
        search: ""
      }
    }
  },
  computed: {
    redisData(){
      return store.modules.redis.getters.data.filter(el=>el ? ( (el.key&&el.key.indexOf(this.form.search)+1) || (el.value&&el.value.indexOf(this.form.search)+1) ) : false);
    },
    getSelectedId(){
      return store.modules.redis.getters.getSelectedId;
    },
    getServers(){
      return store.modules.redis.getters.servers;
    },
    getActiveServer(){
      return store.modules.redis.getters.getActiveServer;
    }
  },
  methods: {
    closeServer(event){
      event.preventDefault();
      if(!store.modules.redis.getters.getActiveServer) return;
      setTimeout(()=>{store.modules.redis.dispatch("disconnect", store.modules.redis.getters.getActiveServer);},0);
      this.$router.push("/");
    },
    addHost(){
      store.modules.redis.dispatch("select", undefined);
      this.$router.push("/");
    },
    checkIsActive(target){
      const active = store.modules.redis.getters.getActiveServer;
      if(!active) return;
      return (target.host.host == active.host.host && target.host.port == active.host.port);
    },
    selectServer(target){
      let targetIndex;
      const servers = store.modules.redis.getters.servers;
      servers.forEach((server, index)=>(targetIndex = (server.host == target.host && server.port == target.port) ?  index : targetIndex));
      if(targetIndex === undefined) return;
      store.modules.redis.dispatch("select", targetIndex);
      this.$router.push("/list");
    }
  }
}
</script>

<style>
#app{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-item{
  cursor: pointer;
}

.toolbar-actions .btn:not(.active){
  cursor: pointer;
}

.toolbar{
  -webkit-app-region: drag;
}

[v-cloak]{
  pointer-events: none !important;
  opacity: 0.0 !important;
}

.default-hide[v-cloak]{
  display: none;
}

.table-pane{
  background: repeating-linear-gradient(to bottom, #F5F5F4 0px, #F5F5F4 23px, #fff 23px, #fff 46px);
}

.toolbar, .tab-group{
  z-index: 100;
}

input{
  cursor: text;
}

</style>
