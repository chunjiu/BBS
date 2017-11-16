function component() { 
    let element = document.createElement('div');
    element.innerHTML = 'Hello webpack';
    return element;
}
document.write('hello ,webpack')
document.getElementById('content').innerHTML = 'webpack';

document.body.appendChild(component());