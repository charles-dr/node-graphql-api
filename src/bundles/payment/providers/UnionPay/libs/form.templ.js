
const frontForm = `
  <!DOCTYPE HTML>
  <html>
  <head>
      <meta charset="utf-8">
      <title>银联支付</title>
  </head>
  <body>
      <div style="text-align:center">等一会儿...</div>
      <form id="payform" name="payform" action="{{url}}" method="post">
          {{inputs}}
      </form>
      <script type="text/javascript">
          document.onreadystatechange = function(){
              if(document.readyState == "complete") {
                  document.payform.submit();
              }
          };
      </script>
  </body>
  </html>
`;

module.exports = {frontForm};