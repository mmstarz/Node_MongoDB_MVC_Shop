// get 404 Page
exports.get404 = (req, res, next) => {
    res.status(404).render('404', {
        status: res.statusCode,
        docTitle: "Page not found",
        path: "/404",
        isAuthenticated: req.session.isLoggedIn
    });
}

// get 500 Page
exports.get500 = (req, res, next) => {
    res.status(500).render('500', {
        status: res.statusCode,
        docTitle: "System error",
        path: "/500",
        isAuthenticated: req.session.isLoggedIn
    });
}