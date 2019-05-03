// btn simply will be this DOM
// this DOM element where the function was executed
const deleteProduct = (dom) => {
    // console.log(dom);
    const prodId = dom.parentNode.querySelector('[name=productId]').value;
    const csrf = dom.parentNode.querySelector('[name=_csrf]').value;
    const productCard = dom.closest('article');
    // send request to the route via .fetch()
    // .fetch() - supported by the browser for sending http requests
    // .fetch() - used for get/send data
    // arguments:
    // FIRST route, will be added to the current route
    // if we not specify another route http://url1/url2/...
    // SECOND is an object where we can configure this request
    fetch('/admin/products/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
    .then(result => {
        // console.log(result);
        return result.json();
    })
    .then(data => {
        console.log(data); // simply response body
        // don't work in IE
        // productCard.remove();
        // works in all browsers
        productCard.parentNode.removeChild(productCard);
    })
    .catch(err => {
        console.log(err)
    })
}

// !important to know 'delete' request don't have a body