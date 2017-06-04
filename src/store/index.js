import host from './modules/host';
import redis from './modules/redis';
import types from './mutation-types';

export default {
  types,
  modules: {
    host,
    redis
  }
}
