import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import VersionSwitcher from './components/VersionSwitcher.vue'
import './styles/custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('VersionSwitcher', VersionSwitcher)
  }
}
