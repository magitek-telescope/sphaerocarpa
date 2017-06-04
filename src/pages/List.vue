<template>
  <div class="window-content" tabindex="-1" v-on:keydown.down="nextKey" v-on:keydown.up="prevKey">
    <div class="pane-group">

      <div class="pane table-pane">

        <table class="table-striped datalist">
          <thead>
            <tr>
              <th class="table-type">Type</th>
              <th class="table-key" >Key</th>
              <th class="table-data">Value</th>
              <th class="table-expire">Expire</th>
            </tr>
          </thead>
          <tbody v-cloak>
            <tr :class="'file_arq'+(index==selectedKey?' active':'')" v-for="(detail, index) in data" :tabindex="10+index" v-on:click="selectKey(detail, index)" v-on:keydown.enter="selectKey(detail, index)">
              <td class="table-type">{{detail.type}}</td>
              <td class="table-key" >{{detail.key}}</td>
              <td class="table-data">{{detail.value}}</td>
              <td class="table-expire">{{detail.expire}}</td>
            </tr>

            <tr class="file_arq" v-on:click="addKey">
              <td class="table-type">+</td>
              <td class="table-key" >&nbsp;</td>
              <td class="table-data">&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <div :class="'modal'+(isModalVisible?' active':'')">
          <div class="modal-background" v-on:click="closeModal"></div>
          <div class="modal-content">
            <form v-on:submit.prevent="saveKey" v-on:keydown.esc="closeModal">
              <div class="form-group">
                <label>Key</label>
                <input type="text" class="form-control" v-model="form.key">
              </div>
              <div class="form-group">
                <label>Type</label>
                <select class="form-control" v-model="form.type" v-if="form.isEdit" disabled>
                  <option>string</option>
                  <option>hash</option>
                  <option>list</option>
                  <option>set</option>
                  <option>zset</option>
                </select>
                <select class="form-control" v-model="form.type" v-else>
                  <option>string</option>
                  <option>hash</option>
                  <option>list</option>
                  <option>set</option>
                  <option>zset</option>
                </select>
              </div>
              <div class="form-group">
                <label>Value</label>
                <textarea class="form-control" v-model="form.value"></textarea>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-form pull-right btn-default" v-on:click="closeModal">Cancel</button>
                <button type="submit" class="btn btn-form pull-right btn-primary" style="margin-right:10px;">Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.datalist{
  display: block;
}

.datalist thead,
.datalist tbody{
  display: block;
  width: 100%;
}

.datalist tbody{
  overflow-y: auto;
}

.datalist tr{
  display: flex;
  width: 100%;
  overflow-x: auto;
}

.datalist .table-type{
  width: 80px;
  text-align: center;
}

.datalist .table-key{
  flex: 3;
}

.datalist .table-data{
  flex: 5;
}

.datalist .table-expire{
  width: 130px;
}

.window-content{
  position: relative;
}

table.datalist{
  height: 100%;
  overflow: auto;
}

.datalist thead{
  position: fixed;
}

.datalist tbody{
  padding-top: 23px;
}

tr:focus, .table-striped tr:focus:nth-child(even){
  color: #fff;
  background-color: #116cd6;
  outline: none;
}

.modal{
  position: fixed;
  left: 0;
  top: 95px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  pointer-events: none;
}

.modal-content{
  width: 60%;
  min-width: 450px;
  max-width: 600px;

  height: 310px;
  background: #EFEFEF;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
  border: solid 1px #BDBDBD;
  border-top: 0;
  transform: translate(0, -348px);
  transition: all 0.25s ease-out;
  padding: 10px;
}

.modal.active{
  pointer-events: auto;
}

.modal.active .modal-content{
  transform: translate(0, 0);
}

.modal.active .modal-background{
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

textarea{
  height: 80px;
}

form button{
  cursor: pointer;
}
</style>

<script>
import store from '../store';

export default {
  props: ["data"],
  data(){
    return {
      form: {
        key: "",
        type: "",
        value: ""
      },
      selectedKey: undefined,
      isModalVisible: false
    }
  },
  created(){
    store.modules.redis.dispatch("fetch");
    setTimeout(()=>{this.$el.focus();},0);
  },
  methods: {
    prevKey(){
      if(this.selectedKey === undefined) this.selectedKey = 0;
      this.selectedKey = Math.max(this.selectedKey-1, 0);
      this.$el.querySelector(`table tbody tr:nth-child(${this.selectedKey+1})`).focus();
    },
    nextKey(){
      if(this.selectedKey === undefined) this.selectedKey = 0;
      this.selectedKey = Math.min(this.selectedKey+1, this.data.length-1);
      this.$el.querySelector(`table tbody tr:nth-child(${this.selectedKey+1})`).focus();
    },
    closeModal(){
      this.isModalVisible = false;
    },
    saveKey(){
      store.modules.redis.dispatch("updateKey", this.form)
      .then((data)=>{
        const rawData = store.modules.redis.getters.data;
        console.log(rawData.map(el=>(el.key == this.form.key ? Object.assign({},el,{value:this.form.value}) : el)));
        store.modules.redis.dispatch("update", rawData.map(el=>(el.key == this.form.key ? Object.assign({},el,{value:this.form.value}) : el)));
        console.log(data);
        this.isModalVisible = false;
      })
      .catch((err)=>{
        console.log(err);
      })
    },
    addKey(){
      this.isModalVisible = true;
      this.form = {isEdit:false, type:"string", key:"", value:""};
    },
    selectKey(detail, index){
      this.isModalVisible = true;
      this.form = Object.assign({isEdit:true},detail);
      setTimeout(()=>{this.$el.querySelector("form > div:nth-child(1) > input").focus();},7);
    }
  }
}
</script>
