/* ============================================
   TEACHERS NOTE V1 - WEB APPLICATION LOGIC
   ============================================ */

(function () {
    // Configuration & Environment Variables Fallback
    var SUPABASE_URL = (typeof window !== 'undefined' && window.NEXT_PUBLIC_SUPABASE_URL && window.NEXT_PUBLIC_SUPABASE_URL.trim()) ? window.NEXT_PUBLIC_SUPABASE_URL.trim() : 'https://rnqxxzsrnohppahmmkwf.supabase.co';
    var SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.NEXT_PUBLIC_SUPABASE_ANON_KEY && window.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) ? window.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucXh4enNybm9ocHBhaG1ta3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTg1MjAsImV4cCI6MjA5MTI5NDUyMH0.Tpf93FkyULwWrjRi8sZhiL3JZj0_rgOmkldYoDK1eRk';

    var CLOUDINARY_CLOUD_NAME = (typeof window !== 'undefined' && window.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && window.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.trim()) ? window.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.trim() : 'yzxdjnkr';
    var CLOUDINARY_UPLOAD_PRESET = (typeof window !== 'undefined' && window.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET && window.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.trim()) ? window.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.trim() : 'uwduiwd';

    var ADMIN_EMAIL = 'codemlabs1@gmail.com';

    // Initialize Supabase Client (PKCE flow with explicit apikey header)
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            flowType: 'pkce',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        global: {
            headers: {
                apikey: SUPABASE_ANON_KEY
            }
        }
    });

    // App Navigation State
    window.currentView = 'view-role';
    window.viewHistory = ['view-role'];
    window.currentUser = null;
    window.currentClassId = null;
    window.currentClassCode = null;
    window.currentSubjectId = null;
    window.currentUploadTopicId = null;
    window.currentStudentId = null;
    window.viewedDocIds = [];

    // ============================================
    // VIEW GROUPS
    // ============================================
    var AUTH_VIEWS = ['view-role', 'view-teacher-login', 'view-teacher-signup', 'view-forgot-pw', 'view-enter-otp', 'view-student-join', 'view-confirm-email', 'view-teacher-pending', 'view-reset-password'];
    var TEACHER_WORKSPACE_VIEWS = ['view-teacher-dashboard', 'view-teacher-topics', 'view-manage-students', 'view-class-settings', 'view-admin-panel'];
    var STUDENT_WORKSPACE_VIEWS = ['view-student-dashboard', 'view-student-topics'];
    var WORKSPACE_VIEWS = TEACHER_WORKSPACE_VIEWS.concat(STUDENT_WORKSPACE_VIEWS);

    // ============================================
    // VIEW SWITCHER & RESPONSIVE DESKTOP NAVIGATION
    // ============================================
    window.showView = function (viewId) {
        var newView = document.getElementById(viewId);
        if (!newView) return;

        // Deactivate whichever top-level view is currently showing
        // (either the shared auth-shell, or one of the workspace sections)
        var oldOuterActive = document.querySelector('#view-container > .view.active');
        if (oldOuterActive) oldOuterActive.classList.remove('active');

        if (AUTH_VIEWS.indexOf(viewId) !== -1) {
            var authShell = document.getElementById('auth-shell');
            authShell.classList.add('active');

            var oldInner = document.querySelector('.auth-form-panel .auth-inner-view.active');
            if (oldInner) oldInner.classList.remove('active');
            newView.classList.add('active');

            updateAuthBrandPanel(viewId);
            document.body.classList.remove('is-authenticated');
        } else {
            newView.classList.add('active');
            if (WORKSPACE_VIEWS.indexOf(viewId) !== -1) {
                document.body.classList.add('is-authenticated');
            } else {
                document.body.classList.remove('is-authenticated');
            }
        }

        window.currentView = viewId;
        updateDesktopSidebar(viewId);
        updateTopbarBreadcrumb(viewId);
    };

    // ============================================
    // AUTH BRAND PANEL (split-screen marketing copy)
    // ============================================
    var CHECK_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    var AUTH_BRAND_CONTENT = {
        generic: {
            title: 'A digital classroom for sharing knowledge.',
            subtitle: 'Organize subjects and topics, share materials, and manage class access — all in one place.',
            features: ['Organize content by subject & topic', 'Share PDFs, images and YouTube videos', 'Control access with a simple class code']
        },
        teacher: {
            title: 'Run your classroom, your way.',
            subtitle: 'Create subjects, upload materials, and keep track of who is engaging with your content.',
            features: ['Approve students and manage access', 'Whitelist emails per subject', 'See document view analytics at a glance']
        },
        student: {
            title: 'Everything your teacher shares, in one place.',
            subtitle: 'Join with a class code and get instant access to the materials you need.',
            features: ['Join a class in seconds with a code', 'Read PDFs and watch videos inline', 'Track which materials you have completed']
        }
    };

    function updateAuthBrandPanel(viewId) {
        var group = 'generic';
        if (['view-teacher-login', 'view-teacher-signup', 'view-forgot-pw', 'view-confirm-email', 'view-teacher-pending'].indexOf(viewId) !== -1) group = 'teacher';
        if (viewId === 'view-student-join') group = 'student';

        var content = AUTH_BRAND_CONTENT[group];
        var titleEl = document.getElementById('auth-brand-title');
        var subEl = document.getElementById('auth-brand-subtitle');
        var featEl = document.getElementById('auth-brand-features');
        if (titleEl) titleEl.textContent = content.title;
        if (subEl) subEl.textContent = content.subtitle;
        if (featEl) {
            featEl.innerHTML = content.features.map(function (f) {
                return '<li><span class="feat-icon">' + CHECK_ICON + '</span><span>' + f + '</span></li>';
            }).join('');
        }
    }

    // ============================================
    // TOP BAR BREADCRUMB
    // ============================================
    var BREADCRUMB_MAP = {
        'view-teacher-dashboard': '<span>Dashboard</span>',
        'view-manage-students': '<span class="crumb-muted">Dashboard</span><span class="crumb-sep">/</span><span>Manage Students</span>',
        'view-class-settings': '<span class="crumb-muted">Dashboard</span><span class="crumb-sep">/</span><span>Class Settings</span>',
        'view-admin-panel': '<span>Admin Panel</span>',
        'view-student-dashboard': '<span>My Subjects</span>'
    };

    function updateTopbarBreadcrumb(viewId) {
        var el = document.getElementById('topbar-breadcrumb');
        if (!el) return;

        if (viewId === 'view-teacher-topics') {
            var subjNameEl = document.getElementById('current-subject-name');
            var subjName = subjNameEl ? subjNameEl.textContent : 'Subject';
            el.innerHTML = '<span class="crumb-muted">Dashboard</span><span class="crumb-sep">/</span><span>' + subjName + '</span>';
            return;
        }
        if (viewId === 'view-student-topics') {
            var sNameEl = document.getElementById('student-current-subject-name');
            var sName = sNameEl ? sNameEl.textContent : 'Subject';
            el.innerHTML = '<span class="crumb-muted">My Subjects</span><span class="crumb-sep">/</span><span>' + sName + '</span>';
            return;
        }
        if (BREADCRUMB_MAP[viewId]) {
            el.innerHTML = BREADCRUMB_MAP[viewId];
        }
    }

    function updateDesktopSidebar(viewId) {
        var navMenu = document.getElementById('desktop-nav-menu');
        var classBadge = document.getElementById('sidebar-class-badge');
        var codeText = document.getElementById('sidebar-code-text');

        var isAuthTeacher = TEACHER_WORKSPACE_VIEWS.indexOf(viewId) !== -1;
        var isAuthStudent = STUDENT_WORKSPACE_VIEWS.indexOf(viewId) !== -1;

        if (isAuthTeacher || isAuthStudent) {
            if (isAuthTeacher) {
                if (classBadge) classBadge.style.display = 'block';
                if (codeText) codeText.textContent = window.currentClassCode || '------';

                var isAdmin = window.currentUser && window.currentUser.email === ADMIN_EMAIL;
                navMenu.innerHTML = `
                    <li class="nav-item ${viewId === 'view-teacher-dashboard' || viewId === 'view-teacher-topics' ? 'active' : ''}" onclick="showView('view-teacher-dashboard')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Dashboard
                    </li>
                    <li class="nav-item ${viewId === 'view-manage-students' ? 'active' : ''}" onclick="showView('view-manage-students'); loadStudents('pending');">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                        Manage Students
                    </li>
                    <li class="nav-item ${viewId === 'view-class-settings' ? 'active' : ''}" onclick="openClassSettings()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Class Settings
                    </li>
                    ${isAdmin ? `
                    <li class="nav-item ${viewId === 'view-admin-panel' ? 'active' : ''}" onclick="showView('view-admin-panel'); loadTeachers('pending');">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        Admin Panel
                    </li>
                    ` : ''}
                `;
            } else if (isAuthStudent) {
                if (classBadge) classBadge.style.display = 'none';
                navMenu.innerHTML = `
                    <li class="nav-item ${viewId === 'view-student-dashboard' || viewId === 'view-student-topics' ? 'active' : ''}" onclick="showView('view-student-dashboard')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        Course Content
                    </li>
                `;
            }
        }
        // Sidebar/topbar visibility itself is driven by the body.is-authenticated
        // class (set in showView), so no inline style toggling is needed here.
    }

    // ============================================
    // UTILITY HELPERS
    // ============================================
    window.setLoading = function (btnId, loading) {
        var btn = document.getElementById(btnId);
        if (!btn) return;
        if (loading) {
            btn.classList.add('loading');
            btn.disabled = true;
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    };

    window.showToast = function (message, type) {
        type = type || 'success';
        var toastEl = document.getElementById('toast');
        var toastMsg = document.getElementById('toast-message');
        var toastIcon = document.getElementById('toast-icon');
        if (!toastEl || !toastMsg) return;

        toastMsg.textContent = message;
        toastEl.className = 'toast show ' + type;

        var icons = {
            success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
            info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };
        toastIcon.innerHTML = icons[type] || icons.info;
        setTimeout(function () { toastEl.classList.remove('show'); }, 3500);
    };

    window.openModal = function (modalId) {
        var modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    };

    window.closeModal = function (modalId) {
        var modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
        if (modalId === 'modal-youtube-player') {
            document.getElementById('youtube-iframe').src = '';
        }
        if (modalId === 'modal-pdf-viewer') {
            document.getElementById('pdf-iframe').src = 'about:blank';
        }
    };

    window.confirmDelete = function (message, callback) {
        document.getElementById('delete-modal-msg').textContent = message;
        window._deleteCallback = callback;
        openModal('modal-delete-confirm');
    };

    window.executeDelete = function () {
        closeModal('modal-delete-confirm');
        if (typeof window._deleteCallback === 'function') {
            window._deleteCallback();
            window._deleteCallback = null;
        }
    };

    // ============================================
    // MEDIA VIEWER (PDF & YOUTUBE)
    // ============================================
    window.openDocument = function (url, fileName, type) {
        // Handle YouTube videos
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            var videoId = getYouTubeId(url);
            if (videoId) {
                document.getElementById('youtube-iframe').src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
                openModal('modal-youtube-player');
                return;
            }
        }

        // Web PDF & Document Previewer Modal
        var modalTitle = document.getElementById('pdf-modal-title');
        var openTabBtn = document.getElementById('pdf-open-tab-btn');
        var iframe = document.getElementById('pdf-iframe');

        if (modalTitle) modalTitle.textContent = fileName || 'Document Preview';
        if (openTabBtn) openTabBtn.href = url;

        // Use Google Docs Viewer wrapper for cross-domain PDFs/office files or direct iframe
        var viewerUrl = (url.endsWith('.pdf') || type.includes('pdf'))
            ? 'https://docs.google.com/viewer?url=' + encodeURIComponent(url) + '&embedded=true'
            : url;

        iframe.src = viewerUrl;
        openModal('modal-pdf-viewer');
    };

    function getYouTubeId(url) {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // ============================================
    // SIGNUP STEPPER, PASSWORD STRENGTH & VISIBILITY
    // ============================================
    function setSignupStep(step) {
        document.querySelectorAll('.signup-step').forEach(function (el) { el.classList.remove('active'); });
        var target = document.querySelector('.signup-step[data-signup-step="' + step + '"]');
        if (target) target.classList.add('active');

        document.querySelectorAll('#signup-stepper .step-item').forEach(function (el) {
            var s = parseInt(el.getAttribute('data-step'), 10);
            el.classList.toggle('active', s <= step);
        });
    }

    window.goToSignupStep = function (step) {
        if (step === 2) {
            var name = document.getElementById('signup-name').value.trim();
            var email = document.getElementById('signup-email').value.trim();
            if (!name || !email) return showToast('Please enter your name and email', 'error');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('Enter a valid email address', 'error');
        }
        setSignupStep(step);
    };

    window.resetSignupForm = function () {
        var form = document.getElementById('form-teacher-signup');
        if (form) form.reset();
        setSignupStep(1);

        var fill = document.getElementById('pw-strength-fill');
        var label = document.getElementById('pw-strength-label');
        var hint = document.getElementById('pw-match-hint');
        if (fill) fill.style.width = '0%';
        if (label) { label.textContent = 'Enter a password'; label.style.color = 'var(--text-muted)'; }
        if (hint) hint.textContent = '';
    };

    window.evaluatePasswordStrength = function (pw) {
        var fill = document.getElementById('pw-strength-fill');
        var label = document.getElementById('pw-strength-label');
        if (fill && label) {
            var score = 0;
            if (pw.length >= 6) score++;
            if (pw.length >= 10) score++;
            if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
            if (/[0-9]/.test(pw)) score++;
            if (/[^A-Za-z0-9]/.test(pw)) score++;

            var levels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
            var colors = ['#ef4444', '#ef4444', '#f59e0b', '#f59e0b', '#22c55e', '#22c55e'];
            var pct = pw.length === 0 ? 0 : Math.min(100, (score / 5) * 100);

            fill.style.width = pct + '%';
            fill.style.background = colors[score];
            label.textContent = pw.length === 0 ? 'Enter a password' : levels[score];
            label.style.color = pw.length === 0 ? 'var(--text-muted)' : colors[score];
        }
        checkPasswordMatch();
    };

    window.checkPasswordMatch = function () {
        var pwEl = document.getElementById('signup-password');
        var cfEl = document.getElementById('signup-confirm');
        var hint = document.getElementById('pw-match-hint');
        if (!pwEl || !cfEl || !hint) return;

        var cf = cfEl.value;
        if (!cf) { hint.textContent = ''; return; }

        if (pwEl.value === cf) {
            hint.textContent = 'Passwords match';
            hint.style.color = 'var(--success)';
        } else {
            hint.textContent = 'Passwords do not match';
            hint.style.color = 'var(--danger)';
        }
    };

    window.togglePasswordVisibility = function (inputId, btn) {
        var input = document.getElementById(inputId);
        if (!input) return;
        var eye = btn.querySelector('.eye-icon');
        var eyeOff = btn.querySelector('.eye-off-icon');
        if (input.type === 'password') {
            input.type = 'text';
            if (eye) eye.style.display = 'none';
            if (eyeOff) eyeOff.style.display = 'block';
        } else {
            input.type = 'password';
            if (eye) eye.style.display = 'block';
            if (eyeOff) eyeOff.style.display = 'none';
        }
    };

    // ============================================
    // TEACHER AUTHENTICATION
    // ============================================
    window.handleTeacherSignup = async function (e) {
        e.preventDefault();
        var name = document.getElementById('signup-name').value.trim();
        var email = document.getElementById('signup-email').value.trim();
        var password = document.getElementById('signup-password').value;
        var confirm = document.getElementById('signup-confirm').value;

        if (!name || !email || !password) return showToast('Please fill out all fields', 'error');
        if (password !== confirm) return showToast('Passwords do not match', 'error');

        setLoading('btn-signup', true);
        try {
            var res = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: { data: { full_name: name } }
            });

            if (res.error) {
                var errStr = res.error.message.toLowerCase();
                if (errStr.includes('already registered') || errStr.includes('already in use') || errStr.includes('already exists')) {
                    showToast('This email is already registered! Directing to Sign In...', 'info');
                    document.getElementById('login-email').value = email;
                    showView('view-teacher-login');
                    return;
                }
                throw res.error;
            }

            // Supabase returns identities: [] if email enumeration prevention is ON and user already exists
            if (res.data && res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
                showToast('This email is already registered! Please sign in instead.', 'info');
                document.getElementById('login-email').value = email;
                showView('view-teacher-login');
                return;
            }

            // Ensure profile record exists with is_approved = false
            if (res.data && res.data.user) {
                try {
                    await window.supabaseClient.from('profiles').upsert({
                        id: res.data.user.id,
                        full_name: name,
                        is_approved: false
                    });
                } catch (e) { console.log('Profile upsert notice:', e); }
            }

            showView('view-confirm-email');
            resetSignupForm();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading('btn-signup', false);
        }
    };

    window.handleTeacherLogin = async function (e) {
        e.preventDefault();
        var email = document.getElementById('login-email').value.trim();
        var password = document.getElementById('login-password').value;

        if (!email || !password) return showToast('Please enter your credentials', 'error');

        setLoading('btn-login', true);
        try {
            var res = await window.supabaseClient.auth.signInWithPassword({ email: email, password: password });
            if (res.error) throw res.error;
            await loadTeacherDashboard(res.data.user);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading('btn-login', false);
        }
    };

    // Store email across the forgot-password → OTP verification steps
    window._resetEmail = '';

    window.handleForgotPassword = async function (e) {
        e.preventDefault();
        var email = document.getElementById('forgot-email').value.trim();
        if (!email) return showToast('Enter your email address', 'error');

        setLoading('btn-forgot', true);
        try {
            // redirectTo must be the production URL so Supabase records it correctly;
            // the OTP flow doesn't rely on this URL for the actual token delivery,
            // but Supabase still validates it against the allowed redirect list.
            var res = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: 'https://teachers-note-v1.vercel.app'
            });
            if (res.error) throw res.error;
            window._resetEmail = email;    // remember for verifyOtp step
            showToast('Reset code sent! Check your email.');
            showView('view-enter-otp');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading('btn-forgot', false);
        }
    };

    window.handleVerifyOtp = async function (e) {
        e.preventDefault();
        var token = document.getElementById('otp-code').value.trim();
        if (!token) return showToast('Enter the 6-digit code from your email', 'error');
        if (!window._resetEmail) return showToast('Session expired — please request a new code', 'error');

        setLoading('btn-verify-otp', true);
        try {
            var res = await window.supabaseClient.auth.verifyOtp({
                email: window._resetEmail,
                token: token,
                type: 'recovery'
            });
            if (res.error) throw res.error;
            // verifyOtp establishes a session → show the set-password screen
            showView('view-reset-password');
            showToast('Code verified! Set your new password.');
        } catch (err) {
            showToast(err.message || 'Invalid or expired code', 'error');
        } finally {
            setLoading('btn-verify-otp', false);
        }
    };

    window.handleSetNewPassword = async function (e) {
        e.preventDefault();
        var pw = document.getElementById('reset-password').value;
        var cf = document.getElementById('reset-confirm').value;
        if (!pw) return showToast('Enter a new password', 'error');
        if (pw !== cf) return showToast('Passwords do not match', 'error');
        if (pw.length < 6) return showToast('Password must be at least 6 characters', 'error');

        setLoading('btn-set-password', true);
        try {
            var res = await window.supabaseClient.auth.updateUser({ password: pw });
            if (res.error) throw res.error;
            showToast('Password updated! Please sign in.');
            await window.supabaseClient.auth.signOut();
            // Clear the hash so the token isn't reused
            history.replaceState(null, '', window.location.pathname);
            showView('view-teacher-login');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading('btn-set-password', false);
        }
    };

    window.handleSignOut = async function () {
        await window.supabaseClient.auth.signOut();
        localStorage.removeItem('student_session');
        location.reload();
    };

    // ============================================
    // TEACHER DASHBOARD & CLASS MANAGEMENT
    // ============================================
    async function loadTeacherDashboard(user) {
        window.currentUser = user;
        var isAdmin = user.email === ADMIN_EMAIL;

        // Check profile approval status for non-admin teachers
        if (!isAdmin) {
            var approvalRes = await window.supabaseClient.from('profiles').select('is_approved').eq('id', user.id).single();
            if (!approvalRes.data || approvalRes.data.is_approved !== true) {
                showView('view-teacher-pending');
                return;
            }
        }

        var res = await window.supabaseClient.from('profiles').select('full_name').eq('id', user.id).single();
        var name = res.data?.full_name || 'Teacher';
        document.getElementById('teacher-name').textContent = name;
        updateSidebarProfile(name, isAdmin ? 'Administrator' : 'Teacher Account');

        // Get or Create assigned Class
        var classRes = await window.supabaseClient.from('classes').select('id, class_code').eq('teacher_id', user.id).single();
        if (classRes.error && classRes.error.code === 'PGRST116') {
            var code = Math.random().toString(36).substring(2, 8).toUpperCase();
            var insertRes = await window.supabaseClient.from('classes').insert({
                teacher_id: user.id,
                name: name + "'s Class",
                class_code: code
            }).select().single();
            window.currentClassId = insertRes.data.id;
            window.currentClassCode = insertRes.data.class_code;
        } else if (classRes.data) {
            window.currentClassId = classRes.data.id;
            window.currentClassCode = classRes.data.class_code;
        }

        document.getElementById('teacher-class-code').textContent = window.currentClassCode || '---';
        document.getElementById('stat-class-code').textContent = window.currentClassCode || '---';

        await loadSubjects();
        await refreshPendingCount();
        showView('view-teacher-dashboard');
    }

    // ============================================
    // SIDEBAR PROFILE & PENDING-APPROVAL INDICATORS
    // ============================================
    function updateSidebarProfile(displayName, roleLabel) {
        var avatarEl = document.getElementById('sidebar-avatar');
        var nameEl = document.getElementById('sidebar-user-name');
        var roleEl = document.getElementById('sidebar-user-role');
        var initials = (displayName || '?').trim().charAt(0).toUpperCase();
        if (avatarEl) avatarEl.textContent = initials || '?';
        if (nameEl) nameEl.textContent = displayName || '';
        if (roleEl) roleEl.textContent = roleLabel || '';
    }

    async function refreshPendingCount() {
        if (!window.currentClassId) return;
        try {
            var res = await window.supabaseClient.from('students').select('id', { count: 'exact', head: true }).eq('class_id', window.currentClassId).eq('status', 'pending');
            var count = res.count || 0;

            var statEl = document.getElementById('stat-pending-count');
            if (statEl) statEl.textContent = count;

            var pill = document.getElementById('topbar-pending-pill');
            if (pill) {
                var pillCount = pill.querySelector('.pill-count');
                if (pillCount) pillCount.textContent = count;
                pill.style.display = count > 0 ? 'inline-flex' : 'none';
            }
        } catch (e) {
            // Non-critical — leave existing counts as-is
        }
    }

    // ============================================
    // CLASS SETTINGS & WHITELIST
    // ============================================
    window.openClassSettings = async function () {
        var res = await window.supabaseClient.from('classes').select('*').eq('id', window.currentClassId).single();
        if (res.data) {
            document.getElementById('setting-require-emails').checked = res.data.require_emails;
            document.getElementById('setting-signup-start').value = res.data.signup_window_start ? res.data.signup_window_start.substring(0, 16) : '';
            document.getElementById('setting-signup-end').value = res.data.signup_window_end ? res.data.signup_window_end.substring(0, 16) : '';
            document.getElementById('whitelist-section').style.display = res.data.require_emails ? 'block' : 'none';
            if (res.data.require_emails) {
                loadWhitelist();
                renderWhitelistSubjectChecks();
            }
        }
        showView('view-class-settings');
    };

    async function renderWhitelistSubjectChecks() {
        var res = await window.supabaseClient.from('subjects').select('id, name').eq('class_id', window.currentClassId);
        var container = document.getElementById('whitelist-subject-checks');
        if (res.data && res.data.length > 0) {
            container.innerHTML = res.data.map(s => `
                <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-weight:normal; cursor:pointer;">
                    <input type="checkbox" name="subject_access" value="${s.id}" checked style="accent-color:var(--accent);"> ${s.name}
                </label>
            `).join('');
        } else {
            container.innerHTML = '<p style="color:var(--text-muted); font-size:0.8rem;">Create subjects first to assign access.</p>';
        }
    }

    window.updateClassSetting = async function (field, value) {
        if (field === 'require_emails') {
            document.getElementById('whitelist-section').style.display = value ? 'block' : 'none';
            if (value) {
                loadWhitelist();
                renderWhitelistSubjectChecks();
            }
        }
        await window.supabaseClient.from('classes').update({ [field]: value || null }).eq('id', window.currentClassId);
        showToast('Setting updated');
    };

    window.loadWhitelist = async function () {
        var res = await window.supabaseClient.from('class_whitelist').select('*').eq('class_id', window.currentClassId);
        var list = document.getElementById('whitelist-list');
        if (res.data && res.data.length > 0) {
            list.innerHTML = res.data.map(w => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:6px; border-bottom:1px solid var(--border); font-size:0.85rem;">
                    <div>
                        <span style="font-weight:600;">${w.email}</span>
                        <span style="font-size:0.75rem; color:var(--accent); margin-left:6px;">(${(w.allowed_subject_ids || []).length} subjects)</span>
                    </div>
                    <button onclick="removeFromWhitelist('${w.id}')" style="color:var(--danger); border:none; background:none; cursor:pointer; font-weight:bold;">&times;</button>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:10px;">No whitelisted emails added</p>';
        }
    };

    window.addToWhitelist = async function () {
        var input = document.getElementById('input-whitelist-email');
        var email = input.value.trim().toLowerCase();
        if (!email) return showToast('Enter an email address', 'error');

        var selectedSubs = Array.from(document.querySelectorAll('input[name="subject_access"]:checked')).map(cb => cb.value);

        var res = await window.supabaseClient.from('class_whitelist').insert({
            class_id: window.currentClassId,
            email: email,
            allowed_subject_ids: selectedSubs
        });

        if (res.error) showToast('Failed or already whitelisted', 'error');
        else {
            input.value = '';
            loadWhitelist();
            showToast('Student email whitelisted');
        }
    };

    window.removeFromWhitelist = async function (id) {
        await window.supabaseClient.from('class_whitelist').delete().eq('id', id);
        loadWhitelist();
        showToast('Whitelist entry removed');
    };

    window.checkClassRequirements = async function (code) {
        if (code.length < 5) return;
        var res = await window.supabaseClient.from('classes').select('require_emails').eq('class_code', code.toUpperCase()).single();
        var group = document.getElementById('group-student-email');
        if (res.data && res.data.require_emails) {
            group.style.display = 'block';
            document.getElementById('student-email').required = true;
        } else {
            group.style.display = 'none';
            document.getElementById('student-email').required = false;
        }
    };

    // ============================================
    // SUBJECTS & TOPICS CRUD
    // ============================================
    window.loadSubjects = async function () {
        var res = await window.supabaseClient.from('subjects').select('*').eq('class_id', window.currentClassId).order('created_at', { ascending: false });
        var list = document.getElementById('subjects-list');
        var empty = document.getElementById('empty-subjects');
        var count = document.getElementById('subject-count');

        if (res.data && res.data.length > 0) {
            if (empty) empty.style.display = 'none';
            if (count) count.textContent = res.data.length;
            list.innerHTML = res.data.map(s => `
                <div class="role-card" onclick="openSubject('${s.id}', '${s.name.replace(/'/g, "\\'")}')">
                    <div class="role-icon-wrap teacher">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    </div>
                    <div class="role-info">
                        <h3>${s.name}</h3>
                    </div>
                    <div class="role-arrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                </div>
            `).join('');
        } else {
            if (empty) empty.style.display = 'block';
            list.innerHTML = '';
            if (count) count.textContent = '0';
        }
    };

    window.createSubject = async function () {
        var input = document.getElementById('input-subject-name');
        if (!input.value.trim()) return showToast('Subject name required', 'error');

        setLoading('btn-create-subject', true);
        var res = await window.supabaseClient.from('subjects').insert({
            class_id: window.currentClassId,
            name: input.value.trim()
        });
        setLoading('btn-create-subject', false);

        if (res.error) showToast(res.error.message, 'error');
        else {
            input.value = '';
            closeModal('modal-subject');
            loadSubjects();
            showToast('Subject created successfully!');
        }
    };

    window.openSubject = async function (id, name) {
        window.currentSubjectId = id;
        document.getElementById('current-subject-name').textContent = name;
        await loadTopics();
        showView('view-teacher-topics');
    };

    window.deleteCurrentSubject = function () {
        confirmDelete("Are you sure? Deleting this subject permanently removes all nested topics and documents.", async function () {
            await window.supabaseClient.from('subjects').delete().eq('id', window.currentSubjectId);
            showToast('Subject deleted');
            showView('view-teacher-dashboard');
            loadSubjects();
        });
    };

    window.loadTopics = async function () {
        var res = await window.supabaseClient.from('topics').select('*, documents(*, document_views(count))').eq('subject_id', window.currentSubjectId).order('created_at', { ascending: true });
        var list = document.getElementById('topics-list');

        // Populate Parent Topic dropdown
        var select = document.getElementById('select-parent-topic');
        select.innerHTML = '<option value="">None (Main Topic)</option>';
        if (res.data) {
            res.data.filter(t => !t.parent_topic_id).forEach(t => {
                select.innerHTML += `<option value="${t.id}">${t.title}</option>`;
            });
        }

        if (res.data && res.data.length > 0) {
            var mainTopics = res.data.filter(t => !t.parent_topic_id);
            var subTopics = res.data.filter(t => t.parent_topic_id);

            list.innerHTML = mainTopics.map(t => {
                var children = subTopics.filter(st => st.parent_topic_id === t.id);
                return fnTopicToHTML(t, children);
            }).join('');
        } else {
            list.innerHTML = '<div class="empty-state"><h3>No topics in this subject</h3><p>Click "Add Topic" to create the first unit.</p></div>';
        }
    };

    function fnTopicToHTML(t, children) {
        var docsHTML = '';
        if (t.documents && t.documents.length > 0) {
            docsHTML = '<div id="docs-container-' + t.id + '" class="docs-container" style="margin-top:10px; display:none; flex-direction:column; gap:6px; border-top:1px solid var(--border); padding-top:10px;">' +
                t.documents.map(d => {
                    var viewCount = d.document_views ? (d.document_views[0]?.count || 0) : 0;
                    return '<div onclick="openDocument(\'' + d.file_url + '\', \'' + d.file_name.replace(/'/g, "\\'") + '\', \'' + (d.file_type || 'application/pdf') + '\')" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:10px 14px; border-radius:8px; font-size:0.9rem; cursor:pointer;" class="doc-box">' +
                        '<span>' + d.file_name + '</span>' +
                        '<div style="display:flex; gap:10px; align-items:center;">' +
                        (viewCount > 0 ? '<div class="engagement-stat" onclick="event.stopPropagation(); showEngagement(\'' + d.id + '\')">👁 ' + viewCount + ' views</div>' : '') +
                        '<button onclick="event.stopPropagation(); deleteDoc(\'' + d.id + '\', \'' + d.file_name.replace(/'/g, "\\'") + '\')" class="btn-ghost" style="color:var(--danger); padding:4px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>' +
                        '</div></div>';
                }).join('') + '</div>';
        }

        var subtopicsHTML = '';
        if (children && children.length > 0) {
            subtopicsHTML = '<div class="nested-topic">' + children.map(st => fnTopicToHTML(st)).join('') + '</div>';
        }

        return '<div class="role-card" style="flex-direction:column; align-items:stretch; cursor:default; margin-bottom:1rem;">' +
            '<div onclick="toggleTopicAccordion(\'' + t.id + '\', event)" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding-bottom:4px;">' +
            '<div style="flex:1;"><h3 style="margin-bottom:2px;">' + t.title + '</h3><span class="topic-desc" style="font-size:0.85rem; color:var(--text-muted);">' + (t.description || 'No description') + '</span></div>' +
            '<div style="display:flex; gap:10px; align-items:center;">' +
            '<svg id="arrow-' + t.id + '" class="topic-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
            '<button onclick="event.stopPropagation(); deleteTopic(\'' + t.id + '\')" class="btn-ghost" style="color:var(--danger); padding:4px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>' +
            '</div></div>' + docsHTML +
            '<button onclick="prepareUpload(\'' + t.id + '\')" class="btn btn-outline" style="padding:8px 12px; font-size:0.85rem; margin-top:10px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> Upload Material</button>' +
            subtopicsHTML +
            '</div>';
    }

    window.createTopic = async function () {
        var title = document.getElementById('input-topic-title');
        var desc = document.getElementById('input-topic-desc');
        var parentId = document.getElementById('select-parent-topic').value;

        if (!title.value.trim()) return showToast('Topic title required', 'error');

        setLoading('btn-create-topic', true);
        var res = await window.supabaseClient.from('topics').insert({
            subject_id: window.currentSubjectId,
            title: title.value.trim(),
            description: desc.value.trim(),
            parent_topic_id: parentId || null
        });
        setLoading('btn-create-topic', false);

        if (res.error) showToast(res.error.message, 'error');
        else {
            title.value = ''; desc.value = '';
            closeModal('modal-topic');
            loadTopics();
            showToast('Topic created successfully!');
        }
    };

    window.deleteTopic = function (topicId) {
        confirmDelete("Delete this topic and all its contents?", async function () {
            await window.supabaseClient.from('topics').delete().eq('id', topicId);
            showToast('Topic deleted');
            loadTopics();
        });
    };

    window.prepareUpload = function (topicId) {
        window.currentUploadTopicId = topicId;
        document.getElementById('input-file').value = '';
        document.getElementById('input-youtube').value = '';
        openModal('modal-upload');
    };

    window.uploadDocument = async function () {
        var fileInput = document.getElementById('input-file');
        var ytInput = document.getElementById('input-youtube');
        var file = fileInput.files[0];
        var ytUrl = ytInput.value.trim();

        if (!file && !ytUrl) return showToast('Select a file or enter a YouTube URL', 'error');

        setLoading('btn-upload-doc', true);

        try {
            if (ytUrl) {
                var res = await window.supabaseClient.from('documents').insert({
                    topic_id: window.currentUploadTopicId,
                    file_name: 'YouTube Video',
                    file_url: ytUrl,
                    file_type: 'video/youtube'
                });
                if (res.error) throw res.error;
                showToast('YouTube video linked!');
            } else if (file) {
                var formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                formData.append('folder', 'TeachersNote');

                var uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) throw new Error('Cloudinary upload failed');
                var cloudData = await uploadRes.json();

                var dbRes = await window.supabaseClient.from('documents').insert({
                    topic_id: window.currentUploadTopicId,
                    file_name: file.name,
                    file_url: cloudData.secure_url,
                    file_type: file.type || 'application/pdf'
                });

                if (dbRes.error) throw dbRes.error;
                showToast('Document uploaded successfully to Cloudinary!');
            }
            closeModal('modal-upload');
            loadTopics();
        } catch (err) {
            showToast('Upload failed: ' + err.message, 'error');
        } finally {
            setLoading('btn-upload-doc', false);
        }
    };

    window.deleteDoc = function (docId, docName) {
        confirmDelete("Remove document '" + docName + "'?", async function () {
            await window.supabaseClient.from('documents').delete().eq('id', docId);
            showToast('Document removed');
            loadTopics();
        });
    };

    window.toggleTopicAccordion = function (topicId, e) {
        if (e && (e.target.closest('button') || e.target.closest('.nested-topic'))) return;

        var docsContainer = document.getElementById('docs-container-' + topicId);
        var arrow = document.getElementById('arrow-' + topicId);
        var parentCard = arrow ? arrow.closest('.role-card') : null;
        var nestedTopic = parentCard ? parentCard.querySelector('.nested-topic') : null;

        var isVisible = (docsContainer && docsContainer.style.display === 'flex') || (nestedTopic && nestedTopic.style.display === 'block');

        if (!isVisible) {
            if (docsContainer) docsContainer.style.display = 'flex';
            if (nestedTopic) nestedTopic.style.display = 'block';
            if (arrow) arrow.style.transform = 'rotate(180deg)';
        } else {
            if (docsContainer) docsContainer.style.display = 'none';
            if (nestedTopic) nestedTopic.style.display = 'none';
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        }
    };

    // ============================================
    // SEARCH & FILTERING LOGIC
    // ============================================
    window.handleGlobalSearch = function (query, listId) {
        var q = query.toLowerCase().trim();
        var list = document.getElementById(listId);
        if (!list) return;

        var items = list.querySelectorAll('.role-card');
        items.forEach(card => {
            var text = card.textContent.toLowerCase();
            var match = q === '' || text.includes(q);
            card.style.display = match ? 'flex' : 'none';

            if (q !== '' && match) {
                var docsContainer = card.querySelector('.docs-container');
                var nestedTopic = card.querySelector('.nested-topic');
                var arrow = card.querySelector('.topic-arrow');
                if (docsContainer) docsContainer.style.display = 'flex';
                if (nestedTopic) nestedTopic.style.display = 'block';
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            }
        });
    };

    window.filterTopics = function (query, listId) {
        var q = query.toLowerCase().trim();
        var list = document.getElementById(listId);
        if (!list) return;

        var topics = list.children;
        for (var i = 0; i < topics.length; i++) {
            var topic = topics[i];
            if (topic.classList.contains('empty-state')) continue;

            var title = topic.querySelector('h3') ? topic.querySelector('h3').textContent.toLowerCase() : '';
            var desc = topic.querySelector('.topic-desc') ? topic.querySelector('.topic-desc').textContent.toLowerCase() : '';

            var matchInTopic = title.includes(q) || desc.includes(q);
            var matchInDoc = false;

            var docs = topic.querySelectorAll('.doc-box');
            docs.forEach(doc => {
                var name = doc.querySelector('span').textContent.toLowerCase();
                if (name.includes(q)) {
                    matchInDoc = true;
                    doc.style.display = 'flex';
                } else {
                    doc.style.display = 'none';
                }
            });

            var docsContainer = topic.querySelector('.docs-container');
            var arrow = topic.querySelector('.topic-arrow');

            if (q !== '') {
                if (matchInTopic || matchInDoc) {
                    topic.style.display = 'flex';
                    if (docsContainer) docsContainer.style.display = 'flex';
                    if (arrow) arrow.style.transform = 'rotate(180deg)';
                } else {
                    topic.style.display = 'none';
                }
                if (matchInTopic && !matchInDoc) {
                    docs.forEach(d => d.style.display = 'flex');
                }
            } else {
                topic.style.display = 'flex';
                docs.forEach(d => d.style.display = 'flex');
                if (docsContainer) docsContainer.style.display = 'none';
                if (arrow) arrow.style.transform = 'rotate(0deg)';
            }
        }
    };

    // ============================================
    // STUDENT PORTAL & PROGRESS TRACKING
    // ============================================
    window.handleStudentJoin = async function (e) {
        e.preventDefault();
        var name = document.getElementById('student-name').value.trim();
        var email = document.getElementById('student-email').value.trim().toLowerCase();
        var code = document.getElementById('student-code').value.trim().toUpperCase();

        if (!name || !code) return showToast('Enter your name and class code', 'error');

        setLoading('btn-join', true);

        try {
            var classRes = await window.supabaseClient.from('classes').select('*').eq('class_code', code).single();
            if (classRes.error || !classRes.data) {
                throw new Error('Invalid class code');
            }
            var cls = classRes.data;

            // Registration Window Validation
            var now = new Date();
            if (cls.signup_window_start && now < new Date(cls.signup_window_start)) {
                throw new Error('Registration is not open yet');
            }
            if (cls.signup_window_end && now > new Date(cls.signup_window_end)) {
                throw new Error('Registration window has closed');
            }

            // Email & Whitelist Verification
            if (cls.require_emails) {
                if (!email) throw new Error('Email required for this class');
                var whiteRes = await window.supabaseClient.from('class_whitelist').select('id').eq('class_id', cls.id).eq('email', email).single();
                if (whiteRes.error) throw new Error('Email address is not whitelisted');
            }

            var joinRes = await window.supabaseClient.from('students').insert({
                display_name: name,
                class_id: cls.id,
                email: email || null,
                status: 'pending'
            }).select().single();

            if (joinRes.error) throw joinRes.error;

            localStorage.setItem('student_session', JSON.stringify({
                student_id: joinRes.data.id,
                name: name,
                class_id: cls.id,
                class_name: cls.name
            }));

            loadStudentDashboard();
            showToast('Joined class successfully!');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading('btn-join', false);
        }
    };

    window.loadStudentDashboard = async function () {
        var session = JSON.parse(localStorage.getItem('student_session'));
        if (!session) return showView('view-role');

        window.currentStudentId = session.student_id;
        document.getElementById('student-display-name').textContent = session.name;
        updateSidebarProfile(session.name, 'Student Account');

        var statusRes = await window.supabaseClient.from('students').select('status, email').eq('id', session.student_id).single();
        if (statusRes.error || !statusRes.data) return showView('view-role');

        var status = statusRes.data.status;
        var studentEmail = statusRes.data.email;

        if (status === 'pending') {
            showView('view-student-dashboard');
            document.getElementById('joined-class-info').textContent = "Status: Pending Approval by Teacher";
            document.getElementById('student-subjects-list').innerHTML = '<div class="empty-state"><h3>Approval Pending</h3><p>Your teacher will grant you access shortly.</p></div>';
            return;
        }

        if (status === 'blocked') {
            showToast('Your class access has been blocked', 'error');
            localStorage.removeItem('student_session');
            return showView('view-role');
        }

        document.getElementById('joined-class-info').textContent = 'Class: ' + session.class_name;

        // Fetch viewed documents for read indicators
        var viewsRes = await window.supabaseClient.from('document_views').select('document_id').eq('student_id', session.student_id);
        window.viewedDocIds = (viewsRes.data || []).map(v => v.document_id);

        // Fetch authorized subjects
        var classRes = await window.supabaseClient.from('classes').select('require_emails').eq('id', session.class_id).single();
        var allowedSubjectIds = null;

        if (classRes.data && classRes.data.require_emails && studentEmail) {
            var whiteRes = await window.supabaseClient.from('class_whitelist').select('allowed_subject_ids').eq('class_id', session.class_id).eq('email', studentEmail).single();
            if (whiteRes.data) allowedSubjectIds = whiteRes.data.allowed_subject_ids;
        }

        var res = await window.supabaseClient.from('subjects').select('*').eq('class_id', session.class_id).order('created_at', { ascending: false });
        var subjects = res.data || [];

        if (allowedSubjectIds && allowedSubjectIds.length > 0) {
            subjects = subjects.filter(s => allowedSubjectIds.includes(s.id));
        }

        renderStudentSubjects(subjects);
        showView('view-student-dashboard');
    };

    function renderStudentSubjects(subjects) {
        var list = document.getElementById('student-subjects-list');
        var empty = document.getElementById('empty-student-subjects');

        if (subjects && subjects.length > 0) {
            if (empty) empty.style.display = 'none';
            list.innerHTML = subjects.map(s => `
                <div class="role-card" onclick="openStudentSubject('${s.id}', '${s.name.replace(/'/g, "\\'")}')">
                    <div class="role-icon-wrap student">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    </div>
                    <div class="role-info">
                        <h3>${s.name}</h3>
                    </div>
                    <div class="role-arrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                </div>
            `).join('');
        } else {
            if (empty) empty.style.display = 'block';
            list.innerHTML = '';
        }
    }

    window.openStudentSubject = async function (id, name) {
        window.studentSubjectId = id;
        document.getElementById('student-current-subject-name').textContent = name;
        await loadStudentTopics();
        showView('view-student-topics');
    };

    window.loadStudentTopics = async function () {
        var res = await window.supabaseClient.from('topics').select('*, documents(*)').eq('subject_id', window.studentSubjectId).order('created_at', { ascending: true });
        renderStudentTopics(res.data || []);
    };

    function renderStudentTopics(topics) {
        var list = document.getElementById('student-topics-list');
        if (topics && topics.length > 0) {
            var mainTopics = topics.filter(t => !t.parent_topic_id);
            var subTopics = topics.filter(t => t.parent_topic_id);

            list.innerHTML = mainTopics.map(t => {
                var children = subTopics.filter(st => st.parent_topic_id === t.id);
                return fnStudentTopicToHTML(t, children);
            }).join('');
        } else {
            list.innerHTML = '<div class="empty-state"><h3>No topics found</h3></div>';
        }
    }

    function fnStudentTopicToHTML(t, children) {
        var docsHTML = '';
        if (t.documents && t.documents.length > 0) {
            docsHTML = '<div id="docs-container-' + t.id + '" class="docs-container" style="margin-top:10px; display:none; flex-direction:column; gap:6px; border-top:1px solid var(--border); padding-top:10px;">' +
                t.documents.map(d => {
                    var isViewed = window.viewedDocIds && window.viewedDocIds.includes(d.id);
                    return '<div onclick="openDocument(\'' + d.file_url + '\', \'' + d.file_name.replace(/'/g, "\\'") + '\', \'' + (d.file_type || 'application/pdf') + '\'); markDocumentViewed(\'' + d.id + '\')" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:10px 14px; border-radius:8px; font-size:0.9rem; cursor:pointer;" class="doc-box">' +
                        '<span>' + d.file_name + '</span>' +
                        '<div style="display:flex; gap:8px; align-items:center;">' +
                        (isViewed ? '<div class="read-badge">✓</div>' : '') +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--info);"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></div>' +
                        '</div>';
                }).join('') + '</div>';
        }

        var subtopicsHTML = '';
        if (children && children.length > 0) {
            subtopicsHTML = '<div class="nested-topic">' + children.map(st => fnStudentTopicToHTML(st)).join('') + '</div>';
        }

        return '<div class="role-card" style="flex-direction:column; align-items:stretch; cursor:default; margin-bottom:1rem;">' +
            '<div onclick="toggleTopicAccordion(\'' + t.id + '\', event)" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding-bottom:4px;">' +
            '<div style="flex:1;"><h3 style="margin-bottom:2px;">' + t.title + '</h3><span class="topic-desc" style="font-size:0.85rem; color:var(--text-muted);">' + (t.description || 'No description') + '</span></div>' +
            '<svg id="arrow-' + t.id + '" class="topic-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
            '</div>' + docsHTML + subtopicsHTML +
            '</div>';
    }

    window.markDocumentViewed = async function (docId) {
        if (!window.currentStudentId) return;
        try {
            await window.supabaseClient.from('document_views').upsert({
                document_id: docId,
                student_id: window.currentStudentId
            }, { onConflict: 'document_id,student_id' });

            if (!window.viewedDocIds.includes(docId)) {
                window.viewedDocIds.push(docId);
            }
        } catch (e) { console.error("View tracking error", e); }
    };

    // ============================================
    // TEACHER STUDENT MANAGEMENT & ANALYTICS
    // ============================================
    window.loadStudents = async function (statusFilter) {
        document.querySelectorAll('#view-manage-students .btn-ghost').forEach(b => {
            b.style.color = 'var(--text-muted)';
            b.style.borderBottom = 'none';
        });
        var activeTab = document.getElementById('tab-' + (statusFilter || 'pending'));
        if (activeTab) {
            activeTab.style.color = 'var(--accent)';
            activeTab.style.borderBottom = '2px solid var(--accent)';
        }

        var res = await window.supabaseClient.from('students').select('*').eq('class_id', window.currentClassId).eq('status', statusFilter || 'pending').order('created_at', { ascending: false });
        var list = document.getElementById('students-list');

        if (res.data && res.data.length > 0) {
            list.innerHTML = res.data.map(s => `
                <div class="data-row">
                    <div class="data-row-main">
                        <div class="data-row-avatar">${(s.display_name || '?').trim().charAt(0).toUpperCase()}</div>
                        <div class="data-row-info">
                            <h3>${s.display_name} ${s.email ? `<span style="font-weight:400; color:var(--text-muted);">(${s.email})</span>` : ''}</h3>
                            <span>Joined ${new Date(s.created_at || Date.now()).toLocaleDateString()} &middot; <span class="status-badge ${s.status}">${s.status}</span></span>
                        </div>
                    </div>
                    <div class="data-row-actions">
                        ${s.status !== 'approved' ? `<button class="btn" style="padding:6px 14px; font-size:0.85rem; margin-top:0; width:auto;" onclick="updateStudentStatus('${s.id}', 'approved')">Approve</button>` : ''}
                        ${s.status !== 'blocked' ? `<button class="btn btn-outline" style="padding:6px 14px; font-size:0.85rem; margin-top:0; width:auto; border-color:var(--danger); color:var(--danger);" onclick="updateStudentStatus('${s.id}', 'blocked')">Block</button>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<div class="empty-state"><h3>No students in this list</h3></div>';
        }
    };

    window.updateStudentStatus = async function (studentId, newStatus) {
        var res = await window.supabaseClient.from('students').update({ status: newStatus }).eq('id', studentId);
        if (res.error) showToast(res.error.message, 'error');
        else {
            showToast('Student ' + newStatus);
            loadStudents(newStatus);
            refreshPendingCount();
        }
    };

    window.showEngagement = async function (docId) {
        openModal('modal-engagement');
        var details = document.getElementById('engagement-details');
        details.innerHTML = '<p style="text-align:center;">Loading stats...</p>';

        var res = await window.supabaseClient
            .from('document_views')
            .select('viewed_at, students(display_name, email)')
            .eq('document_id', docId)
            .order('viewed_at', { ascending: false });

        if (res.data && res.data.length > 0) {
            details.innerHTML = `
                <div style="background:var(--success-bg); color:var(--success); padding:10px 14px; border-radius:8px; font-weight:700; margin-bottom:1rem;">
                    Total Views: ${res.data.length}
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${res.data.map(v => `
                        <div style="display:flex; justify-content:space-between; padding-bottom:6px; border-bottom:1px solid var(--border); font-size:0.9rem;">
                            <span style="font-weight:600;">${v.students?.display_name || 'Unknown Student'}</span>
                            <span style="font-size:0.8rem; color:var(--text-muted);">${new Date(v.viewed_at).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            details.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No student views logged yet.</p>';
        }
    };

    // ============================================
    // ADMIN PANEL
    // ============================================
    window.loadTeachers = async function (statusFilter) {
        document.querySelectorAll('#view-admin-panel .btn-ghost').forEach(b => {
            b.style.color = 'var(--text-muted)';
            b.style.borderBottom = 'none';
        });
        var activeTab = document.getElementById('teacher-tab-' + (statusFilter || 'pending'));
        if (activeTab) {
            activeTab.style.color = 'var(--accent)';
            activeTab.style.borderBottom = '2px solid var(--accent)';
        }

        var isApproved = (statusFilter === 'approved');
        var query = window.supabaseClient.from('profiles').select('id, full_name, created_at, is_approved');
        if (isApproved) {
            query = query.eq('is_approved', true);
        } else {
            query = query.or('is_approved.eq.false,is_approved.is.null');
        }
        var res = await query.order('created_at', { ascending: false });
        var list = document.getElementById('teachers-list');

        if (res.data && res.data.length > 0) {
            list.innerHTML = res.data.map(t => `
                <div class="data-row">
                    <div class="data-row-main">
                        <div class="data-row-avatar">${(t.full_name || '?').trim().charAt(0).toUpperCase()}</div>
                        <div class="data-row-info">
                            <h3>${t.full_name || 'Teacher Account'}</h3>
                            <span>Signed up ${t.created_at ? new Date(t.created_at).toLocaleDateString() : 'recently'} &middot; <span class="status-badge ${isApproved ? 'approved' : 'pending'}">${isApproved ? 'approved' : 'pending'}</span></span>
                        </div>
                    </div>
                    <div class="data-row-actions">
                        ${!isApproved ? `<button class="btn" style="padding:6px 14px; font-size:0.85rem; margin-top:0; width:auto;" onclick="updateTeacherStatus('${t.id}', true)">Approve</button>` : ''}
                        ${isApproved ? `<button class="btn btn-outline" style="padding:6px 14px; font-size:0.85rem; margin-top:0; width:auto; border-color:var(--danger); color:var(--danger);" onclick="updateTeacherStatus('${t.id}', false)">Revoke</button>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<div class="empty-state"><h3>No teachers found</h3></div>';
        }
    };

    window.updateTeacherStatus = async function (teacherId, approve) {
        var res = await window.supabaseClient.from('profiles').upsert({ id: teacherId, is_approved: approve });
        if (res.error) showToast(res.error.message, 'error');
        else {
            showToast(approve ? 'Teacher approved!' : 'Teacher access revoked');
            loadTeachers(approve ? 'approved' : 'pending');
        }
    };

    // ============================================
    // ON LOAD INIT
    // ============================================
    window.onload = async function () {
        var hash = window.location.hash || '';

        // 1. Handle Supabase error redirects in hash (e.g. stale link from old email)
        if (hash.includes('error=')) {
            var errParams = new URLSearchParams(hash.substring(hash.indexOf('error=')));
            var desc = errParams.get('error_description') || 'This reset link is invalid or has expired.';
            showToast(desc, 'error');
            history.replaceState(null, '', window.location.pathname);
            showView('view-forgot-pw');
            return;
        }

        // 2. Returning from Supabase recovery redirect (#access_token=... or ?code=...)
        var isPasswordReset = hash.includes('type=recovery') || hash.includes('type=invite') || window.location.search.includes('code=');

        // 4. Listen for Supabase PASSWORD_RECOVERY auth event
        window.supabaseClient.auth.onAuthStateChange(function (event, session) {
            if (event === 'PASSWORD_RECOVERY') {
                showView('view-reset-password');
            }
        });

        if (isPasswordReset) {
            var sessionCheck = await window.supabaseClient.auth.getSession();
            if (sessionCheck.data && sessionCheck.data.session) {
                showView('view-reset-password');
                return;
            }
        }

        var studentSession = localStorage.getItem('student_session');
        if (studentSession) {
            loadStudentDashboard();
        } else {
            var sessionRes = await window.supabaseClient.auth.getSession();
            if (sessionRes.data && sessionRes.data.session) {
                loadTeacherDashboard(sessionRes.data.session.user);
            } else {
                showView('view-role');
            }
        }
    };

})();
