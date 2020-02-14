(function(){
  'use strict'

  const nodeConfig = {
                      detachedMin:4,
                      externalMax:3,
                      loadingData: [
                                      'Obtaining Externally Linked Sites',
                                      'Formatting Graph Data',
                                      'Loading Graph',
                                      'Loading User Information',
                                      'Loading Logs',
                                      'Gathering Starting Points',
                                      'COMPLETE'
                                  ],
                      loadingPos:0,
                    }

  const dispatchLogLine = (obj) =>
  {
    const { whichLog='arweave', msg=obj } = obj,
          appStatus = whichLog === 'arweave'
                      ? ` <${nodeConfig.loadingData[nodeConfig.loadingPos]}>`
                      : ''
    // [ARWEAVE]: <Obtaining Externally Linked Sites> Response:   https://arweave.net:443/tx/Tz9DOAEs5GUpFgKXPrYIa2WLYKn1Qb6qfGaDrAWMayU - 200

    const logMsg = `[${whichLog.toUpperCase()}]:${appStatus} ${msg}`,
          logElm = document.querySelector(`awlpw-log[dataid="${whichLog.toLowerCase()}"]`)
    console.log('logMsg',logMsg,logElm)
  }

  const arweave = Arweave.init({logging: true, logger: dispatchLogLine})
  let arNetwork,
      blocksLoaded = [], // [max, ..., min]
      nodeHash = {} // {  baseUrl:string: {links:{<btoa(url)>: {url:string, type:'internal|external', txnId:string|null} }, txn:{<txnId>: {data:string, owner:string, tags: {title, timestamp}}}} }

  const obtainExternalLinks = () => // START loadingData[5]
  {
    //this can all be done on click from the first level nodes.
      // do this AFTER displaying graph
    nodeConfig.loadingPos = 5
    dispatchLogLine('Node has been selected. Obtaining internal information');
    console.log('obtainExternalLinks:NodeHash',nodeHash)
  } // END loadingData[5]
  
  const formatGraphData = () => // START loadingData[1]
  {
    nodeConfig.loadingPos = 1
    dispatchLogLine('Initial Blocks have been parsed');
    console.log('formatGraphData:NodeHash',nodeHash)
  } // END loadingData[1]

  const loadNodes = (obj) => // START loadingData[0]
  {
    nodeConfig.loadingPos = 0
    const validateTags = (txns) =>
    {
      const txnsQueries = txns.map(itm => arweave.transactions.get(itm))
      Promise.allSettled(txnsQueries).then(txQs =>
      {
        txQs.forEach(txQ =>
        {
          let isValid = false,
              baseUrl
          if(txQ.status === 'fulfilled')
          {
            txQ.tagDecode = {}
            txQ.value.get('tags').forEach(tag => 
            {
              let k = tag.get('name', {decode: true, string: true}),
                  v = tag.get('value', {decode: true, string: true})
              if(k === 'page:url')
              {
                baseUrl = v.replace(/.*:\/\/(www\.)?/,'').replace(/[^\w-.].*/,'').split('.')
                while(baseUrl.length > 2){ baseUrl.shift() }
                baseUrl = baseUrl.join('.')
                isValid = true
              }

              txQ.tagDecode[k] = v
            })
            if(isValid){
              let txnObj = {},
                  link = {}
                  link[btoa(txQ.tagDecode['page:url'])] = {url:txQ.tagDecode['page:url'], type:'internal', txnId:txQ.value.id}
                  delete txQ.tagDecode['page:url']

                  txnObj = {
                    data: txQ.value.data+'',
                    owner: txQ.value.owner+'',
                    tags: txQ.tagDecode,
                  }
              //internal links should start being set here as well
              if(!nodeHash[baseUrl]){ nodeHash[baseUrl] = { links:{}, txn:{}} }
              nodeHash[baseUrl].links = {...nodeHash[baseUrl].links, ...link}
              nodeHash[baseUrl].txn[txQ.value.id] = txnObj
            }
          }
        })
        if(Object.keys(nodeHash).length < nodeConfig.detachedMin){ loadBlock(blocksLoaded.last-1) }
        else{ formatGraphData() }
      })
      .catch(err => console.error(err))
    }

    const loadBlock = (blk) =>
    {
      //375340 - 375364, 375403 <-- good blocks for debugging [a lot of twitter]
      arweave.api.get(`/block/height/${blk}`)
        .then(obj => {
          blocksLoaded.push(blk)
          obj.data.txs.length ? validateTags(obj.data.txs) : loadBlock(--blk)
        })
        .catch(err => console.error(err))
    }

    arweave.network.getInfo()
      .then(obj =>
            {
              arNetwork = {...obj} //clone in case we need to mutate anything
              // loadBlock(375364) // <-- GREAT for Debug
              // loadBlock(375403) // <-- GREAT for Debug
              loadBlock(arNetwork.height)
            })
        .catch(err => console.error(err))
  } // END loadingData[0]

  const queryTxn = (txn) =>
  {
    //BELOW IS DONE IF txn IS QUERIED DIRECTLY
      // ALLOWS TAGS TO COME BACK PARSED VERY QUICKLY
    /**
    curl 'https://arweave.net/arql'
    -H 'authority: arweave.net'
    -H 'origin: https://mdflqndwudrx.arweave.net'
    -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.131 Safari/537.36'
    -H 'content-type: text/plain;charset=UTF-8'
    -H 'accept: *//*'
    -H 'sec-fetch-site: same-site'
    -H 'sec-fetch-mode: cors'
    -H 'referer: https://mdflqndwudrx.arweave.net/A7ctf1azriZxHGWKurMQfDFrGOncG-MBn4A59Tt1kzw/index.html'
    -H 'accept-encoding: gzip, deflate, br'
    -H 'accept-language: en-US,en;q=0.9' --data-binary '
    {"query":"query 
    {\n    transaction(id: \"Cn_kOJHBAGQ0XaaiL5wRZ6byC-LSBg2Mhdzz79C-0SM\") 
    {\n      id,\n      tags 
    {\n        name,\n        value\n      }\n    }\n  }"}' --compressed
    */
      // THEN THE REST OF THE DATA IS RETRIEVED WITH THE TAGS ENCODED AND IGNORED
    //  https://arweave.net/tx/Cn_kOJHBAGQ0XaaiL5wRZ6byC-LSBg2Mhdzz79C-0SM
  }


  // const loadLogs = (obj) => {
  //       arweave.arql({
  //   //   op: "equals",
  //   //   expr1: "type",
  //   //   expr2: "comment"
  //   }).then(obj => console.log('obj',obj)) }
  
  const authorizeUser = (obj) => {
    console.log('for auth: https://github.com/mul1sh/ar-auth#developers')
  }
  console.warn('UNCOMMENT `loadNodes()` BELOW WHEN READY')
  // loadNodes()
})()