(function (window, $, _) {
    $.widget('githubUsersCompareNamespace.githubUsersCompare', {
        options: {
            usersInputSelector: '.js-users-input',
            usersFormSelector: '.js-users-form',
            dataTargetSelector: '.data-target',
            gitHubAPIUrl: 'https://api.github.com/',
            noUsersFoundTargetSelector: '#no-users-found',
            noUsersFoundTemplateSelector: '#no-users-found-template',
            userRepositoriesTargetSelector: '#user-repositories',
            userRepositoriesTemplateSelector: '#user-repositories-template',
            userCompareTargetSelector: '#users-compare',
            userCompareTemplateSelector: '#users-compare-template'
        },
        _setHash: function (hash) {
            if (hash.length) {
                window.location.hash = hash;
            }
        },
        _getHash: function () {
            return window.location.hash.substr(1);
        },
        _getUserRepositoriesListSortAndShow: function () {
            var that = this;
            var repositoriesInfo = [];
            var userName = this.userNames[0];

            $.ajax({
                url: this.options.gitHubAPIUrl + 'users/' + userName + '/repos',
                dataType: 'json',
                success: function (data) {
                    data.forEach(function (repository) {
                        repositoriesInfo.push({
                            name: repository.name,
                            starsCount: repository.stargazers_count
                        });
                    });

                    repositoriesInfo = _.sortBy(repositoriesInfo, function (repositoryInfo) {
                        return -repositoryInfo.starsCount;
                    });

                    that.userRepositoriesTarget.html(that.userRepositoriesTemplate({
                        repositoriesInfo: repositoriesInfo
                    }));
                }
            });
        },
        _getUserStarsCountAndCallback: function (userName, callback) {
            var starsOverallCount = 0;
            $.ajax({
                url: this.options.gitHubAPIUrl + 'users/' + userName + '/repos',
                dataType: 'json',
                success: function (data) {
                    data.forEach(function (repository) {
                        starsOverallCount += repository.stargazers_count;
                    });
                    callback(starsOverallCount);
                }
            });
        },
        _compareUsersMostStars: function () {
            var that = this;
            var userNamesLength = this.userNames.length;
            var checkedUserNamesLength = 0;
            var usersInfo = [];

            this.userNames.forEach(function (userName) {
                that._getUserStarsCountAndCallback(userName, function (starsOverallCount) {
                    usersInfo.push({
                        userName: userName,
                        starsOverallCount: starsOverallCount
                    });
                    checkedUserNamesLength++;
                    if (checkedUserNamesLength === userNamesLength) {
                        usersInfo = _.sortBy(usersInfo, function (userInfo) {
                            return -userInfo.starsOverallCount;
                        });
                        that.userCompareTarget.html(that.userCompareTemplate({
                            usersInfo: usersInfo
                        }));
                    }
                });
            });
        },
        _checkUsersCountAndCallNeededModule: function () {
            switch (this.userNames.length) {
                case 0:
                    break;
                case 1:
                    this._getUserRepositoriesListSortAndShow();
                    break;
                default:
                    this._compareUsersMostStars();
                    break;
            }
        },
        _showNoUsersFoundMessage: function (nonExistingUserNames) {
            this.noUsersFoundTarget.html(this.noUsersFoundTemplate({
                userNames: nonExistingUserNames
            }));
        },
        _removeNonExistingUsersAndCallback: function (callback) {
            var that = this;
            var userNamesLength = this.userNames.length;
            var checkedCounter = 0;
            var existingUserNames = [];
            var nonExistingUserNames = [];

            this.userNames.forEach(function (userName) {
                $.ajax({
                    url: that.options.gitHubAPIUrl + 'users/' + userName,
                    dataType: 'json',
                    success: function () {
                        existingUserNames.push(userName);
                    },
                    statusCode: {
                        404: function () {
                            nonExistingUserNames.push(userName);
                        }
                    },
                    complete: function () {
                        checkedCounter ++;
                        if (checkedCounter === userNamesLength) {
                            if (nonExistingUserNames.length) {
                                that._showNoUsersFoundMessage = $.proxy(that._showNoUsersFoundMessage, that);
                                that._showNoUsersFoundMessage(nonExistingUserNames);
                            }
                            that.userNames = existingUserNames;
                            callback();
                        }
                    }
                });
            });
        },
        _showUserReposOrCompareUsersMostStars: function (submitEvent) {
            var inputtedUsers = this.usersInput.val();
            this.userNames = inputtedUsers.replace(/\s+/g, '').split(',');
            this._checkUsersCountAndCallNeededModule = $.proxy(this._checkUsersCountAndCallNeededModule, this);

            submitEvent.preventDefault();

            this.dataTargets.empty();
            this._setHash(inputtedUsers);

            this._removeNonExistingUsersAndCallback(this._checkUsersCountAndCallNeededModule);
        },
        _create: function() {
            this.usersInput = $(this.options.usersInputSelector, this.element);
            this.usersForm = $(this.options.usersFormSelector, this.element);
            this.dataTargets = $(this.options.dataTargetSelector, this.element);
            this.noUsersFoundTarget = $(this.options.noUsersFoundTargetSelector);
            this.noUsersFoundTemplate = _.template($(this.options.noUsersFoundTemplateSelector).html());
            this.userRepositoriesTarget = $(this.options.userRepositoriesTargetSelector);
            this.userRepositoriesTemplate = _.template($(this.options.userRepositoriesTemplateSelector).html());
            this.userCompareTarget = $(this.options.userCompareTargetSelector);
            this.userCompareTemplate = _.template($(this.options.userCompareTemplateSelector).html());

            this._showUserReposOrCompareUsersMostStars = $.proxy(this._showUserReposOrCompareUsersMostStars, this);

            this.usersInput.val(this._getHash);
            this.usersForm.on('submit', this._showUserReposOrCompareUsersMostStars);
        },
        _destroy: function () {
            this.usersInput.val(null);
            this.usersForm.off('submit', this._showUserReposOrCompareUsersMostStars);

            this.usersInput = null;
            this.usersForm = null;
            this.dataTargets = null;
            this.noUserFoundTarget = null;
            this.noUserFoundTemplate = null;
            this.userRepositoriesTarget = null;
            this.userRepositoriesTemplate = null;
            this.userCompareTarget = null;
            this.userCompareTemplate = null;
        }
    });
} (window, jQuery, _));

/*
    1. We must check github API and internet connection at first.
    2. Add preloaders.
*/