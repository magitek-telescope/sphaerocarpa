<template lang="html">
  <div class="window-content">
    <div class="pane-group">

      <div class="pane pane-sm sidebar">
        <nav class="nav-group" v-cloak>
          <h5 class="nav-group-title">Hosts</h5>
          <span :class="'nav-group-item'+(index==selectedHostId?' active':'')" v-for="(host, index) in getHosts" v-on:click="selectHost(index, host)" v-on:contextmenu="popupHostMenu(index)" v-cloak>
            <span class="icon icon-rocket"></span>{{host.host}}{{host.host&&host.port?":":"New Host"}}{{host.port}}
          </span>
        </nav>
      </div>

      <div class="home pane">
        <div class="content">
          <form class="form" v-on:submit.prevent="doConnect">

            <div class="form-group">
              <label>Host</label>
              <input v-model="form.host" type="text" class="form-control" placeholder="localhost">
            </div>

            <div class="form-group">
              <label>Port</label>
              <input v-model="form.port" type="text" class="form-control" placeholder="6379">
            </div>

            <div class="form-group">
              <label>Password</label>
              <input v-model="form.password" type="password" class="form-control">
            </div>
          </form>

          <div class="clearfix buttons">
            <button class="btn btn-primary" v-on:click="doConnect">Connect</button>
            <button class="btn btn-default" v-if="!selectedHostId" v-on:click="addToHosts">Add to Hosts</button>
            <!-- <button class="btn btn-default" v-else v-on:click="addToHosts">Update Host</button> -->
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>
.pane.home{
  background: #ECECEC;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pane.home .content{
  width: 400px;
  height: 330px;
  margin: 0 auto;
}

.pane.home .content .form{
  width: 400px;
  height: 240px;
  padding: 10px;
  background: #E2E2E2;
  margin-bottom: 10px;
  box-shadow: inset 0 0 1px rgba(0,0,0,0.05);
}

.nav-group-item:hover{
  background: #DCDFE1;
}

.nav-group-item{
  cursor: pointer;
}

.buttons{
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

button{
  width: 150px;
  margin-right: 10px;
}
</style>

<script>
import store from '../store';
import {remote} from 'electron';
const {Menu,MenuItem} = remote;
let menu;

export default {
  data(){
    return {
      selectedHostId: 0,
      form: {
        active: undefined,
        host: "",
        port: "",
        password: ""
      }
    }
  },
  computed:{
    getHosts(){
      return ([{host:"",port:"",password:""}]).concat(store.modules.host.getters.hosts);
    }
  },
  created(){
    store.modules.host.dispatch("initialize");

    menu = new Menu();
    menu.append(new MenuItem({
      label: 'Delete Host',
      click: (e) => {
        store.modules.host.dispatch("remove", this.active-1);
      }
    }))
  },
  methods: {
    doConnect(){
      const hostData = {
        host     : this.form.host     || "localhost",
        port     : this.form.port     || 6379,
        password : this.form.password || ""
      };

      let isDuplicate, duplicateId;


      store.modules.redis.getters.servers.forEach((server, index)=>{
        if(hostData.host == server.host.host && hostData.port == server.host.port){
          isDuplicate = true;
          duplicateId = index;
        }
      });

      if(isDuplicate){
        store.modules.redis.dispatch("select", duplicateId);
        this.$router.push("/list");
        return;
      }

      store.modules.redis.dispatch("add", hostData);
      const result = store.modules.redis.dispatch("initialize");
      result
      .then(()=>{
        this.$router.push("/list");
      })
      .catch((e)=>{
        alert("サーバーへの接続に失敗しました！");
        console.log(e);
        store.modules.redis.dispatch("disconnect", store.modules.redis.getters.getSelectedId);
        store.modules.redis.dispatch("remove"    , store.modules.redis.getters.getSelectedId);
        store.modules.redis.dispatch("select"    , undefined);
      });
    },

    selectHost(index, host){
      this.selectedHostId = index;
      this.form = JSON.parse(JSON.stringify(host));
    },

    addToHosts(){
      const hostData = {
        host     : this.form.host     || "localhost",
        port     : this.form.port     || 6379,
        password : this.form.password || ""
      };
      store.modules.host.dispatch("add", hostData);
      this.form =  JSON.parse(JSON.stringify(hostData));
    },

    popupHostMenu(index){
      this.active = index;
      menu.popup(remote.getCurrentWindow());
    }
  }
}
</script>
