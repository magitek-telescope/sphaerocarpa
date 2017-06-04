import Vue from 'vue/dist/vue';
import VueRouter from 'vue-router';
import App from './App.vue';
import store from './store';
import routes from './routes';

Vue.use(VueRouter);

const router = new VueRouter({routes});

router.beforeEach((to, from, next)=>{
  if(to.path != "/" && store.modules.redis.getters.getSelectedId === undefined){
    next("/");
    return;
  }
  next();
})

const app = new Vue({
  el: "#app",
  render: h=>h(App),
  router
});

// Key Bindings
document.addEventListener("keydown", (e)=>{
  if(!e.metaKey) return;

  if(e.key == "w"){
    e.preventDefault();
    const index = store.modules.redis.getters.getSelectedId;
    store.modules.redis.dispatch("disconnect", index);
    store.modules.redis.dispatch("remove", index);
    store.modules.redis.dispatch("unfocus");
    app.$router.push("/");
  }

  // 新規サーバー接続
  if(e.key == "t" || e.key == "n"){
    store.modules.redis.dispatch("unfocus");
    app.$router.push("/");
  }

  if(e.key == "m"){
    e.preventDefault();
    console.log(app);
    // app.$router.push()
  }

  // サーバー移動（左）
  if(e.key == "ArrowLeft"){
    if(!store.modules.redis.getters.servers.length) return;

    if(store.modules.redis.getters.getSelectedId === undefined){
      store.modules.redis.dispatch("select", store.modules.redis.getters.servers.length-1);
      app.$router.push("/list");
      return;
    }

    store.modules.redis.dispatch(
      "select",
      Math.max((store.modules.redis.getters.getSelectedId||0)-1, 0)
    )
    app.$router.push("/list");
  }

  // サーバー移動（右）
  if(e.key == "ArrowRight"){
    if(!store.modules.redis.getters.servers.length) return;
    if((store.modules.redis.getters.getSelectedId||0)+1 > store.modules.redis.getters.servers.length-1){
      store.modules.redis.dispatch("unfocus");
      app.$router.push("/");
      return;
    }

    store.modules.redis.dispatch(
      "select",
      (store.modules.redis.getters.getSelectedId||0)+1
    )
    app.$router.push("/list");
  }

});
