import ListComponent from '../components/list.mjs'

(function(){
  let tmpl = document.createElement('template')
      tmpl.innerHTML = `
      <link rel="stylesheet" href="./assets/styles/css/modules/log.css">
      
      <div class="log-wrapper">
        <h3>Log</h3>
        <awlpw-componentlist>Loadinsdfg...</awlpw-componentlist>
      </div>`

  class AwLpwLog extends HTMLElement
  {
    constructor() {
      super();

      let shadowRoot = this.attachShadow({mode: 'open'});
      shadowRoot.appendChild(tmpl.content.cloneNode(true));
    }

    connectedCallback()
    {
      // this.addEventListener('awlpw-log', obj => {
        //   document.querySelector('playercard-base')
        //     .shadowRoot.querySelector('playercard-back')
        //       .shadowRoot.querySelector('form')
        //         .setAttribute('style','display:none')
        //   document.querySelector('playercard-base')
        //     .shadowRoot.querySelector('playercard-front')
        //       .shadowRoot.querySelector('playercard-frontheader')
        //         .singlePlayerStatsList = selectedPlayer[0]
        //   document.querySelector('playercard-base')
        //     .shadowRoot.querySelector('playercard-front')
        //       .shadowRoot.querySelector('playercard-frontstats')
        //         .singlePlayerStatsList = selectedPlayer[0]
      // })
      this._setModuleAttributes()

      customElements.whenDefined('awlpw-log').then(() => { // root loaded, wait for nested components
        Promise.all([ //Remove when `slotchange` support recognizes initial load
                customElements.whenDefined('awlpw-componentlist'),
                // customElements.whenDefined('playercard-front'),
                // customElements.whenDefined('playercard-frontheader'),
                // customElements.whenDefined('playercard-frontstats'),
              ]).then(_ => this._handleNestedComponentsLoaded());
      })
    }

    disconnectedCallback()
    { }

    _handleNestedComponentsLoaded()
    { // when ALL components loaded
        console.log('ALL CONNECTED')

      // document.querySelector('playercard-base')
      //   .shadowRoot.querySelector('playercard-back')
      //     .playerStatsList = parsedStats.list
    }
    
    _setModuleAttributes(){
      for(let i=0; i< this.attributes.length; i++)
      {
        if(!this.hasAttribute(this.attributes[i].name))
        { this.setAttribute(this.attributes[i].name, this.getAttribute[i]||true); }
      }
    }
    static get observedAttributes() 
    { return [/*attrName*/] } // return destructured list of attributes to listen to
    /*
      get attrName() { return this.hasAttribute('attrName'); }
      set attrName(val) { (val) ? this.setAttribute(val.toString(), '') : this.removeAttribute(val.toString()) }
    */

    attributeChangedCallback(attrName, oldVal, newVal)
    {/* handle side effects only - get/set for state updates */}
  }
  window.customElements.define('awlpw-log', AwLpwLog);
})()