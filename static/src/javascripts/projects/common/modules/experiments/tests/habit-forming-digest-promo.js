define([
    'common/utils/config',
    'common/utils/storage',
    'common/utils/template',
    'common/utils/fastdom-promise',
    'common/modules/ui/message',
    'common/modules/commercial/user-features',
    'common/views/svgs',
    'lodash/objects/defaults',
    'text!common/views/experiments/habit-digest-promo.html'
], function (
    config,
    storage,
    template,
    fastdomPromise,
    Message,
    userFeatures,
    svgs,
    defaults,
    digestPromo
) {
    return function () {
        this.id = 'HabitFormingDigestPromo';
        this.start = '2016-07-13';
        this.expiry = '2016-08-13';
        this.author = 'Kate Whalen';
        this.description = 'Show infrequent users a banner offering a curated digest';
        this.audience = 0;
        this.audienceOffset = 0;
        this.successMeasure = 'Find if there is demand for various Guardian digest offerings';
        this.audienceCriteria = 'Infrequent visitors, excluding first time visits';
        this.dataLinkNames = 'habit forming digest promo';
        this.idealOutcome = 'Visitors click on the CTA and demonstrate demand for the feature';

        this.canRun = function () {
            return !(config.page.isAdvertisementFeature) &&
            config.page.contentType === 'Article' &&
            isInfrequentVisitor();
        };

        var defaultData = {
            arrowRight: svgs('arrowRight')
        };

        // check if the user is one of the target audience
        function isInfrequentVisitor() {
            if (storage.local.isStorageAvailable()) {
                var alreadyVisited = storage.local.get('gu.alreadyVisited') || 0;
                if (alreadyVisited > 3 && !userFeatures.isPayingMember()) {
                    return true;
                }
            }
            return false;
        }

        function renderDigestSnap(messageText, linkText, linkHref, variantName) {
            var data = defaults(
                {linkText: linkText},
                {messageText: messageText},
                {linkHref: linkHref},
                {variantName: variantName},
                defaultData);

            var cssModifierClass = 'habit-digest';

            return new Message('habit-digest-message-07-16', {
                pinOnHide: false,
                siteMessageLinkName: 'habit digest message',
                siteMessageCloseBtn: 'habit digest hide',
                cssModifierClass: cssModifierClass
            }).show(template(digestPromo, data));
        }

        this.variants = [
            {
                id: 'digest',
                test: function () {
                    var messageText = 'Get a package of stories tailored to you';
                    var linkText = 'Sign up';
                    var linkHref = '/survey/mydigest';
                    renderDigestSnap(messageText, linkText, linkHref, 'digest');
                }
            }, {
                id: 'weekend',
                test: function () {
                    var messageText = 'Get the best reads of the week in your inbox every Saturday';
                    var linkText = 'Sign up';
                    var linkHref = '/survey/weekendreading';
                    renderDigestSnap(messageText, linkText, linkHref, 'weekend');
                }
            }, {
                id: 'headlines',
                test: function () {
                    var messageText = 'Get the top headlines in your inbox every morning';
                    var linkText = 'Sign up';
                    var linkHref = '/info/2015/dec/08/daily-email-uk';
                    renderDigestSnap(messageText, linkText, linkHref, 'headlines');
                }
            }
        ];
    };
});