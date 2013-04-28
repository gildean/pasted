(function (ace, $, window, document, undefined) {
    "use strict";
    // set some selectors and initial values
    var status = $('#status'),
        editel = $('#editor'),
        simpledit = $('#simpledit'),
        returnscreen = $('#returnscreen'),
        buttons = $('#buttons'),
        or = $('#or'),
        loginbox = $('#loginbox'),
        loginbutton = $('#loginbutton'),
        usernameinput = $('#username'),
        passwordinput = $('#password'),
        conflabel = $('#conflabel'),
        confirmationinput = $('#passwordconf'),
        registerbutton = $('#registerbutton'),
        aboutbox = $('#aboutbox'),
        topbar = $('#topbar'),
        langsel = $('#lang'),
        named = $('#named'),
        csrf = $('#csrf'),
        docid = $('#docid'),
        theme = $('#theme'),
        settings = $('#settings'),
        langs = $('#langs'),
        langS = langs.val(),
        langModes = {
            'CoffeeScript': 'coffee',
            'C#': 'csharp',
            'CSS': 'css',
            'Dart': 'dart',
            'Diff': 'diff',
            'Dot': 'dot',
            'Go': 'golang',
            'HAML': 'haml',
            'HTML': 'html',
            'C/C++': 'c_cpp',
            'Clojure': 'clojure',
            'Jade': 'jade',
            'Java': 'java',
            'JSP': 'jsp',
            'JavaScript': 'javascript',
            'JSON': 'json',
            'LaTeX': 'latex',
            'LESS': 'less',
            'Lisp': 'lisp',
            'LiveScript': 'livescript',
            'Scheme': 'scheme',
            'Lua': 'lua',
            'LuaPage': 'luapage',
            'Lucene': 'lucene',
            'Makefile': 'makefile',
            'Markdown': 'markdown',
            'Objective-C': 'objectivec',
            'OCaml': 'ocaml',
            'Pascal': 'pascal',
            'Perl': 'perl',
            'pgSQL': 'pgsql',
            'PHP': 'php',
            'Powershell': 'powershell',
            'Python': 'python',
            'R': 'r',
            'RDoc': 'rdoc',
            'RHTML': 'rhtml',
            'Ruby': 'ruby',
            'OpenSCAD': 'scad',
            'Scala': 'scala',
            'SCSS': 'scss',
            'SASS': 'sass',
            'SH': 'sh',
            'SQL': 'sql',
            'Stylus': 'stylus',
            'SVG': 'svg',
            'Tex': 'tex',
            'Text': 'text',
            'Textile': 'textile',
            'Typescript': 'typescript',
            'VBScript': 'vbscript',
            'XML': 'xml',
            'XQuery': 'xquery',
            'YAML': 'yaml'
        },
        simple = false,
        links = null,
        cookies = {},
        editor = ace.edit('editor');

    editor.getSession().setMode('ace/mode/' + langModes[langS]);

    // actions per settings
    var userSettings = {
        wordwrap: function (val) {
            editor.getSession().setUseWrapMode(val);
        },
        linehilight: function (val) {
            editor.setHighlightActiveLine(val);
        },
        lineselect: function (val) {
            editor.setSelectionStyle((val) ? 'line' : 'text');
        },
        showinvisible: function (val) {
            editor.setShowInvisibles(val);
        },
        indentguides: function (val) {
            editor.setDisplayIndentGuides(val);
        },
        showgutter: function (val) {
            editor.renderer.setShowGutter(val);
        },
        showprint: function (val) {
            editor.setShowPrintMargin(val);
        },
        wordhilight: function (val) {
            editor.setHighlightSelectedWord(val);
        },
        theme: function (val) {
            editor.setTheme('ace/theme/' + val);
        }
    };

    // actions for each toprow button
    var buttonActions = {
        simple: function () {
            if (simple) {
                simple = false;
                editor.setValue(simpledit.text());
                editor.clearSelection();
            } else {
                simple = true;
                simpledit.html(editor.getValue()).wrap('<pre />');
            }
            editel.fadeToggle();
            simpledit.fadeToggle();
        },
        raw: function () {
            if (document.location.pathname !== '/') {
                window.location.href = window.location.href + '?raw';
            } else {
                updateStatus('Save your paste first');
            }
        },
        setbutton: function () {
            settings.fadeToggle();
        },
        login: function () {
            loginbox.fadeToggle();
        },
        about: function () {
            aboutbox.fadeToggle();
        },
        fullscreen: function () {
            topbar.fadeToggle();
            returnscreen.fadeToggle();
            editel.css('top', '5px');
            simpledit.css('top', '5px');
        },
        link: function () {
            if (document.location.pathname !== '/') {
                window.prompt("Copy to clipboard: Ctrl+C, Enter", window.location.href);
            } else {
                updateStatus('Nothing to link');
            }
        },
        copy: function () {
            this.save();
        },
        save: function () {
            var text = editor.getValue();
            if ('' !== text) {
                var edit = {
                    paste: text,
                    lang: langs.val(),
                    _csrf: csrf.val(),
                    id: docid.val()
                };
                ajaxPost(edit, '/save/', function (err, done) {
                    if (!err && done) {
                        edit.id = done.id;
                        updateStatus('Saved!');
                        pushToState(edit, done.name, done.id, '/' + done.owner + '/' + done.name);
                    } else {
                        updateStatus(err.responseText);
                    }
                });
            } else {
                updateStatus('Nothing to save');
            }
        },
        reset: function () {
            editor.setValue('');
        },
        lang: function () {
            var l = langsel.find('option:selected').text();
            langS = langModes[l];
            langs.val(l);
            editor.getSession().setMode('ace/mode/' + langS);
            setCookie('lang', l);
        }
    };

    // check the cookies and set new if none found
    (function checkCookies() {
        var cookiearray = document.cookie.replace(/ /g, '').split(';');
        if (cookiearray.length > 1) {
            var text = editor.getValue();
            var edit = {
                paste: text,
                lang: langs.val(),
                _csrf: csrf.val(),
                id: docid.val()
            };
            pushToState(edit, named.val(), edit.id, window.location.href);
            cookiearray.forEach(function (crumb) {
                var splitted = crumb.split('=');
                cookies[splitted[0]] = splitted[1];
            });
        } else {
            var expr = ' expires=Wed, 01 Jan 2020 00:00:01 GMT; path=/';
            [
                'lineselect=false;',
                'showinvisible=false;',
                'indentguides=true;',
                'showgutter=true;',
                'showprint=true;',
                'wordwrap=false;',
                'wordhilight=false;',
                'linehilight=true;',
                'theme=monokai;'
            ].forEach(function (crumb) {
                document.cookie = crumb + expr;
            });
            return checkCookies();
        }
        Object.keys(cookies).forEach(function (key) {
            var val;
            if (key !== 'theme' && key !== 'lang') {
                val = (cookies[key] === 'true') ? true : false;
                $('#' + key).prop('checked', val);
            } else if (key === 'lang' && langs.prop('name') !== 'db') {
                langS = cookies[key];
            } else if (key === 'theme') {
                val = cookies[key];
            }
            if (userSettings.hasOwnProperty(key)) {
                userSettings[key](val);
            }
        });
    }());

    //setup the editor
    theme.val(cookies.theme);
    langsel.val(langS);

    // the small status-indicator
    function updateStatus(statusText) {
        (function tryAgain() {
            if ('' === status.text()) {
                status.text(statusText).fadeIn(300, function () {
                    $(this).delay(2500).fadeOut(1000, function () {
                        $(this).text('');
                    });
                });
            } else {
                setTimeout(tryAgain, 1000);
            }
        }());
    }

    // set a cookie, remove old if already set
    function setCookie(cookieName, value) {
        var val;
        if (Object.keys(cookies).indexOf(cookieName) > -1) {
            document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
        }
        if (cookieName !== 'theme') {
            val = (value === 'true') ? true : false;
        } else {
            val = value;
        }
        cookies[cookieName] = val;
        document.cookie = cookieName + '=' + value + '; path=/';
    }

    // a ajax-post-req helper function which returns a callback
    function ajaxPost(json, url, callback) {
        $.ajax({
            url: url,
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            type: 'POST',
            data: JSON.stringify(json),
            success: function (data) {
                callback(null, data);
            },
            error: function (err) {
                callback(err, null);
            }
        });
    }

    // this fades the menus/indicators if clicked outside the said menu
    function fadeMenus(event) {
        $('#aboutbox, #loginbox, #settings').each(function () {
            var el = $(this);
            if (event.target.id !== el.id && el.is(':visible') && !el.data('fading')) {
                el.data('fading', true);
                el.fadeOut(300, function () {
                    el.data('fading', false);
                });
            }
        });
    }

    // the push-state navigation
    function pushToState(data, name, id, url) {
        docid.val(id);
        window.history.pushState(data, name + '|| Pasted', url);
    }

    window.onpopstate = function (e) {
        if (e.state) {
            docid.val(e.state.id);
            editor.setValue(e.state.paste);
            langsel.val(e.state.lang);
        }
    };

    //pre-text editor enter-handler
    simpledit.keypress(function (evt) {
        var thisKey = evt.keyCode ? evt.keyCode : evt.which;
        if (thisKey === 13) {
            evt.preventDefault();
            evt.stopPropagation();
            var sel, range, br, addedBr = false;
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                br = document.createTextNode('\r\n');
                range.insertNode(br);
                range.setEndAfter(br);
                range.setStartAfter(br);
                sel.removeAllRanges();
                sel.addRange(range);
                addedBr = true;
            }
        }
    });
    
    // the click handlers
    loginbox.submit(function (e) {
        e.preventDefault();
    });

    returnscreen.click(function () {
        $(this).fadeToggle();
        topbar.fadeToggle();
        editel.css('top', '35px');
        simpledit.css('top', '35px');
    });

    registerbutton.click(function (e) {
        confirmationinput.fadeToggle();
        conflabel.fadeToggle();
        $(this).fadeToggle();
        loginbutton.val('register');
        loginbox.animate({
            height: '+=50'
          }, 500, function() {
            // Animation complete.
        });
    });

    buttons.on('click', function (event) {
        event.stopPropagation();
        event.preventDefault();
        fadeMenus(event);
        var eid = event.target.id;
        if (buttonActions.hasOwnProperty(eid)) {
            return buttonActions[eid]();
        }
    });

    editel.on('click', fadeMenus);

    settings.on('change', function (event) {
        event.stopPropagation();
        event.preventDefault();
        var eid = event.target.id,
            that = $('#' + eid),
            val = (eid !== 'theme') ? that.prop('checked') : that.find('option:selected').text().replace(/ /g, '_');
        if (userSettings.hasOwnProperty(eid)) {
            setCookie(eid, val);
            return userSettings[eid](val);
        }
    });

}(ace, $, window, document));
