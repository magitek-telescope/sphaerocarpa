import HomePage from '../pages/Home.vue';
import ListPage from '../pages/List.vue';
import ConsolePage from '../pages/Console.vue';

export default [
  {
    path: '/',
    component: HomePage
  },
  {
    path: '/list',
    component: ListPage
  },
  {
    path: '/console',
    component: ConsolePage
  }
];
