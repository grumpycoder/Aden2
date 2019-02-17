using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http.Controllers;

namespace Aden.Web.Filters
{
    public class MyApiControllerActionInvoker : ApiControllerActionInvoker
    {
        public override Task<HttpResponseMessage> InvokeActionAsync(HttpActionContext actionContext, System.Threading.CancellationToken cancellationToken)
        {
            var result = base.InvokeActionAsync(actionContext, cancellationToken);

            if (result.Exception?.GetBaseException() == null) return result;

            var baseException = result.Exception.GetBaseException();

            //if (baseException is BusinessException)
            //{
            //    return Task.Run<HttpResponseMessage>(() => new HttpResponseMessage(HttpStatusCode.InternalServerError)
            //    {
            //        Content = new StringContent(baseException.Message),
            //        ReasonPhrase = "Error"

            //    });
            //}
            //else
            //{
            //Log critical error
            Debug.WriteLine(baseException);

            return Task.Run(() => new HttpResponseMessage(HttpStatusCode.InternalServerError)
            {
                Content = new StringContent(baseException.Message),
                ReasonPhrase = "Critical Error"
            });
            //}

        }
    }
}
