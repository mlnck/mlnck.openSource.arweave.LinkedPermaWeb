(function(){
  'use strict'

  const arweave = Arweave.init({logging: true}),
        nodeConfig = {
                      detachedMin:8,
                    }
  let arNetwork,
      nodesLoading = true,
      blocksLoaded = [], // [max, ..., min]
      nodeHash = {} // {  baseUrl:string: [<txnId>: {data:string, tags: {url, title, timestamp}}] }

  const loadNodes = (obj) =>
  {
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
              let k = tag.get('name', {decode: true, string: true});
              let v = tag.get('value', {decode: true, string: true});
              if(k === 'page:url')
              {
                baseUrl = v.replace(/.*:\/\//,'').replace(/[^\w.].*/,'').split('.')
                while(baseUrl.length > 2){ baseUrl.shift() }
                baseUrl = baseUrl.join('.')
                isValid = true
              }

              txQ.tagDecode[k] = v
            })
            if(isValid){
              let txnObj = {}
                  txnObj[txQ.value.id] = {
                    data: txQ.value.data+'',
                    tags: txQ.tagDecode
                  }
              nodeHash[baseUrl] = nodeHash[baseUrl]
                                  ? [
                                      ...nodeHash[baseUrl],
                                      txnObj
                                    ]
                                  : [txnObj]
            }
          }
        })
        if(Object.keys(nodeHash).length < nodeConfig.detachedMin)
        { loadBlock(blocksLoaded.last-1) }
        else{ console.log('MADE IT'); console.log('blocksLoaded',blocksLoaded) }
        console.log('nodeHash',nodeHash)
        console.log('Object.keys(nodeHash).length',Object.keys(nodeHash).length)
      })
      .catch(err => console.error(err))
    }

    const loadBlock = (blk) =>
    {
      //375340 - 375364 <-- good blocks for debugging [a lot of twitter]
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
              loadBlock(obj.height)
            })
        .catch(err => console.error(err))

  }
  loadNodes()
  

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

  const loadLogs = (obj) => {
      //   arweave.arql({
    //   op: "equals",
    //   expr1: "type",
    //   expr2: "comment"
    // }).then(obj => console.log('obj',obj))
  }
  const authorizeUser = (obj) => {
    console.log('for auth: https://github.com/mul1sh/ar-auth#developers')
  }
})()