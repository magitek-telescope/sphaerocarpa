import Vue from 'vue/dist/vue';
import Vuex from 'vuex';
import * as types from '../mutation-types';
import moment from 'moment';
import splitargs from 'redis-splitargs';
Vue.use(Vuex);
import {createClient} from 'then-redis';
import Redis from 'ioredis';


const whitelist = [
  "QUIT",
  "AUTH",
  "EXISTS",
  "DEL",
  "TYPE",
  "KEYS",
  "RANDOMKEY",
  "RENAME",
  "RENAMENX",
  "DBSIZE",
  "EXPIRE",
  "PERSIST",
  "TTL",
  "SELECT",
  "MOVE",
  "FLUSHDB",
  "FLUSHALL",
  "SET",
  "GET",
  "GETSET",
  "MGET",
  "SETNX",
  "SETEX",
  "MSET",
  "MSETNX",
  "INCR",
  "INCRBY",
  "DECR",
  "DECRBY",
  "APPEND",
  "SUBSTR",
  "RPUSH",
  "LPUSH",
  "LLEN",
  "LRANGE",
  "LTRIM",
  "LINDEX",
  "LSET",
  "LREM",
  "LPOP",
  "RPOP",
  "BLPOP",
  "BRPOP",
  "RPOPLPUSH",
  "SADD",
  "SREM",
  "SPOP",
  "SMOVE",
  "SCARD",
  "SISMEMBER",
  "SINTER",
  "SINTERSTORE",
  "SUNION",
  "SUNIONSTORE",
  "SDIFF",
  "SDIFFSTORE",
  "SMEMBERS",
  "SRANDMEMBER",
  "ZADD",
  "ZREM",
  "ZINCRBY",
  "ZRANK",
  "ZREVRANK",
  "ZRANGE",
  "ZREVRANGE",
  "ZRANGEBYSCORE",
  "ZCOUNT",
  "ZCARD",
  "ZSCORE",
  "ZREMRANGEBYRANK",
  "ZREMRANGEBYSCORE",
  "ZUNIONSTORE / ZINTERSTORE",
  "HSET",
  "HGET",
  "HMGET",
  "HMSET",
  "HINCRBY",
  "HEXISTS",
  "HDEL",
  "HLEN",
  "HKEYS",
  "HVALS",
  "HGETALL",
  "SORT",
  "MULTI",
  "EXEC",
  "DISCARD",
  "WATCH",
  "UNWATCH",
  "SUBSCRIBE",
  "UNSUBSCRIBE",
  "PUBLISH",
  "SAVE",
  "BGSAVE",
  "LASTSAVE",
  "SHUTDOWN",
  "BGREWRITEAOF",
  "INFO",
  "MONITOR",
  "SLAVEOF",
  "CONFIG",
  "WAIT"
];

// console.log(new Command('get', ['foo', ['bar', ['zoo', 'zoo']]]) );
const state = {
  selected: undefined,
  servers: []
}

const getters = {
  data: state => {
    if(state.selected === undefined) return [];
    return state.servers[state.selected].data;
  },
  servers: state => {
    return state.servers;
  },
  getSelectedId: state => {
    return state.selected;
  },
  getActiveServer: state => {
    if(state.selected === undefined) return undefined;
    return state.servers[state.selected];
  }
}

const mutations = {
  [types.REDIS_ADD_SERVER](state, host){
    state.servers.push({
      host,
      connection: {},
      data: []
    });
    state.selected = state.servers.length-1;
  },

  [types.REDIS_SELECT_SERVER](state, target){
    state.selected = target;
  },

  [types.REDIS_CONNECT_DATABASE](state, data){
    if(state.selected === undefined) return [];
    state.servers[state.selected].connection = new Redis(state.servers[state.selected].host);
  },

  [types.REDIS_UPDATE_DATA](state, data){
    if(state.selected === undefined) return [];
    state.servers[state.selected].data = data;
  },

  [types.REDIS_REMOVE_SERVER](state, index){
    state.servers = state.servers.filter((s,i)=>i!=index);
  },

  [types.REDIS_DISCONECT_SERVER](state, target){
    state.selected = undefined;
    target.connection.disconnect();
    state.servers = [];
  }
}

const actions = {
  add({commit}, host){
    commit(types.REDIS_ADD_SERVER, host);
  },

  initialize({commit}){;
    return new Promise((resolve, reject) => {
      commit(types.REDIS_CONNECT_DATABASE);

      let isWaiting = true;
      let retry = 5;

      const wait = () => {
        setTimeout(()=>{
          if(!isWaiting) return;
          if(state.servers[state.selected].connection.status == "connecting"){
            setTimeout(()=>{wait();}, 50);
          }
          isWaiting = false;
          if(
            state.servers[state.selected].connection.status != "end" &&
            state.servers[state.selected].connection.status != "reconnecting" &&
            state.servers[state.selected].connection.status != "connecting"
          ){
            console.log(state.servers[state.selected].connection.status);
            resolve();
            return;
          }else{
            retry--;
            if(retry == 0){
              reject(state.servers[state.selected].connection.status);
              return
            }
            isWaiting = true;
            setTimeout(()=>{wait();}, 50);
          }
        }, 50);
      }
      wait();
    });
  },

  disconnect({commit}, target){
    commit(types.REDIS_DISCONECT_SERVER, target);
  },

  remove({commit}, index){
    commit(types.REDIS_REMOVE_SERVER, index);
  },

  select({commit}, target){
    commit(types.REDIS_SELECT_SERVER, target);
  },

  unfocus({commit}){
    commit(types.REDIS_SELECT_SERVER, undefined);
  },

  async fetch({commit}){
    const keys = await state.servers[state.selected].connection.keys('*');
    const result = [];

    for(const key of keys){
      const type  = await state.servers[state.selected].connection.type(key);
      const ttl = await state.servers[state.selected].connection.ttl(key);
      const expire = (ttl == -1) ? "" : moment().add(ttl, 'second').format("YYYY/MM/DD HH:mm");

      let value;
      switch (type) {
        case "string": {
          value = await state.servers[state.selected].connection.get(key);
          break;
        }

        case "hash": {
          const rawData = await state.servers[state.selected].connection.hgetall(key);
          value = Object.keys(rawData).map(key=>`${key}:${rawData[key]}`).join(",\t")
          break;
        }

        case "list": {
          const rawData = await state.servers[state.selected].connection.lrange(key, 0, -1);
          value = `[${rawData.join(",")}]`;
          break;
        }

        case "set": {

          break;
        }

        case "zset": {

          break;
        }

        default: {
          value = "undefined";
        }
      }
      result.push({ type, key, expire, value });
    }
    commit(types.REDIS_UPDATE_DATA, result);
  },

  update({commit}, data){
    commit(types.REDIS_UPDATE_DATA, data);
  },

  updateKey({commit}, data){
    switch (data.type) {
      case "string":
        return state.servers[state.selected].connection.set(data.key, data.value);
      default:
        Promise.reject("Error.");
    }
  },

  execute({commit}, command){
    return new Promise((resolve, reject)=>{
      const tokens = splitargs(command);
      tokens[0] = tokens[0].toLowerCase();

      if(whitelist.indexOf(tokens[0].toUpperCase()) == -1 ){
        reject(`(error) ERR unknown command '${tokens[0]}'`);
        return;
      }

      state.servers[state.selected].connection.pipeline([tokens]).exec(function (err, res) {
        if(err){
          reject(err);
          return;
        }
        console.log(res);

        switch (typeof res[0][1]) {
          case "object":
            resolve(res[0][1].join("<br>"))
            break;
          default:
            resolve(res[0][1]);
        }
        return;
      });
    });
  }
}

export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations
});
