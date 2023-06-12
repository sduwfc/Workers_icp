addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  let url = new URL(request.url)
  let domain = url.searchParams.get('d')

  if (!domain) {
    return new Response(indexPage(), {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  if (!/^https?:\/\//i.test(domain)) {
    domain = 'http://' + domain;
  }

  const apiUrl = "https://cgi.urlsec.qq.com/index.php?m=check&a=check&url=" + domain
  const apiResponse = await fetch(apiUrl, { headers: { 'Referer': 'https://guanjia.qq.com' } })

  const apiData = await apiResponse.text()
  const data = JSON.parse(apiData.slice(1, -1)).data.results
  const whitetype = ['报白', '拦截', '正常']

  let result = {}
  if (data && data.whitetype) {
    if (data.isDomainICPOk === 1) {
      result.ICPSerial = data.ICPSerial
      result.Orgnization = data.Orgnization
    }
    const qqData = {
      'name': 'QQ',
      'states': whitetype[data.whitetype-1],
      'msg': data.WordingTitle
    }
    result.data = [qqData]
  }

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
  })
}

function indexPage() {
  return `<!DOCTYPE html>
<html>
<head>
  <title>URL检测</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- ... your other HTML content ... -->
</head>
<body>
  <h1>URL检测</h1>
  <form>
    <label for="urls">请输入URL，多个URL用英文逗号分隔：</label>
    <input type="text" id="urls" name="urls" placeholder="例如：www.example.com, www.baidu.com">
    <button type="submit">检测</button>
  </form>
  <div class="result"></div>
  <script>
    const form = document.querySelector('form');
    const result = document.querySelector('.result');
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const urls = document.querySelector('#urls').value.trim();
      if (urls) {
        const urlArray = urls.split(',').map(url => url.trim());
        result.innerHTML = '';
        urlArray.forEach(url => {
          fetch('/check?d=' + url)
          .then(response => response.json())
            .then(data => {
              console.log(data);
              if (data.data) {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.innerHTML = 
                  '<h2>' + url + '</h2>' + 
                  '<p>状态：' + data.data[0].states + '</p>' + 
                  '<p>---备案信息---' + data.data[0].msg + '</p>' +
                  '<p>ICP备案号：' + (data.ICPSerial || '无') + '</p>' +
                  '<p>备案主体：' + (data.Orgnization || '无') + '</p>';
                result.appendChild(resultItem);
              } else {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.innerHTML = 
                  '<h2>' + url + '</h2>' +
                  '<p>检测失败，请稍后再试</p>';
                result.appendChild(resultItem);
              }
            })
            .catch(error => {
              console.error(error);
              const resultItem = document.createElement('div');
              resultItem.className = 'result-item';
              resultItem.innerHTML = 
                '<h2>' + url + '</h2>' +
                '<p>检测失败，请稍后再试</p>';
              result.appendChild(resultItem);
            });
        });
      }
    });
  </script>
</body>
</html>`;
}
