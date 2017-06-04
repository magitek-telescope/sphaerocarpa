<template lang="html">
  <div class="window-content">
    <div class="pane-group">
      <div class="console pane" v-on:click="focusForm" v-on:keydown.up="getBeforeCommand" v-on:keydown.down="getAfterCommand">
        <div class="scroll-area">
          <div :class="'line '+log.type" v-for="log in logs">
            <span v-html="(log.header||'')+log.body"></span>
          </div>
          <form class="line input" v-on:submit.prevent="onSubmit">
            <span class="redis">({{getActiveServer.host.host}}:{{getActiveServer.host.port}}) >&nbsp;</span>
            <input type="text" ref="command">
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.console{
  color: #fff;
  background: #000;
  padding: 10px;
  font-family: Monaco;
}

.line.input{
  display: flex;
}

.line.input input{
  flex:1;
  color: #fff;
  border: 0;
  background: transparent;
  outline: none;
}

.line.success{
  color: #D6FCB9;
}

.line.error{
  color: #FFC4BE;
}
</style>

<script>
import store from '../store';

export default {
  data(){
    return {
      logs: [],
      index: 0
    }
  },
  computed: {
    getActiveServer(){
      return store.modules.redis.getters.getActiveServer;
    }
  },
  methods: {
    onSubmit(){
      this.logs.push({
        type: "plain",
        header: `(${this.getActiveServer.host.host}:${this.getActiveServer.host.port}) > `,
        body: this.$refs.command.value
      });

      if(this.$refs.command.value){
        store.modules.redis.dispatch("execute", this.$refs.command.value)
        .then((body)=>{
          this.logs.push({
            type: "success",
            body
          });
          setTimeout(()=>{
            this.$el.querySelector(".console").scrollTop = this.$el.querySelector(".scroll-area").clientHeight;
          },0);
        })
        .catch((body)=>{
          this.logs.push({
            type: "error",
            body
          });
          setTimeout(()=>{
            this.$el.querySelector(".console").scrollTop = this.$el.querySelector(".scroll-area").clientHeight;
          },0);
        });
      }

      this.$refs.command.value = "";
      this.index = this.logs.filter(log=>log.type=="plain").length;
    },
    focusForm(){
      this.$el.querySelector("input").focus();
    },
    getBeforeCommand(){
      if(!this.index) return;
      this.index --;
      this.updateCommand();
    },
    getAfterCommand(){
      if(this.index >= this.logs.filter(log=>log.type=="plain").length-1) return;
      this.index ++;
      this.updateCommand();
    },
    updateCommand(){
      this.$refs.command.value = this.logs.filter(log=>log.type=="plain")[this.index].body;
    }
  }
}
</script>
