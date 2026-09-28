export const ADSSTRA_728X90 = `
<script>
  atOptions = {
    'key' : '8024711d40326f7754d8b83abf91bf25',
    'format' : 'iframe',
    'height' : 90,
    'width' : 728,
    'params' : {}
  };
</script>
<script src="https://www.highperformanceformat.com/8024711d40326f7754d8b83abf91bf25/invoke.js"></script>
`;

export const AADS_728X90 = `
<div id="frame" style="width: 100%;margin: auto;">
  <iframe data-aa='2447863' src='//acceptable.a-ads.com/2447863/?size=Adaptive'
    style='border:0; padding:0; width:70%; height:auto; overflow:hidden;display: block;margin: auto'></iframe>
</div>
`;

export const ZERADS_728X90 = `
<iframe src="https://zerads.com/ad/ad.php?width=728&ref=11352" marginwidth="0" marginheight="0" width="728" height="90" scrolling="no" border="0" frameborder="0"></iframe>
`;

export const ADS_BITCOIN_300X250 = `
<iframe src="//ads-bitcoin.com/app/codes/banner?rcd=MjE3MQ==" scrolling="no" style="width:300px; height:250px; border:0px; padding:0;overflow:hidden" allowtransparency="true"></iframe>
`;

// HilltopAds' stock snippet assumes it is parsed inline, so it drops the banner
// next to the last <script> on the page. AdEmbed injects it after load, where
// that is the end of <body> - the banner landed below the footer and outlived
// the page. The additions to the stock code:
//   - appendTo: the zone script's own setting for where to render; we point it
//     at the AdEmbed slot this snippet runs in. The loader tag itself stays at
//     the end of <body> - if it were removed before running, the zone script
//     would fall back to pinning the banner over the top-right of the page.
//   - window.ffd033: the zone's "already rendered" flag. It assumes one render
//     per full page load, which would leave the slot empty after client-side
//     navigation. Clearing it gives each page view its own banner.
//   - onload cleanup: the zone script claims the first unclaimed loader tag on
//     the page, so a tag left behind (e.g. one that bailed on the flag) would
//     hand a later page view a stale slot. Once the tag has run it is removed,
//     along with the banner if its slot was gone by then (the zone script puts
//     it right after the tag in that case).
export const HILLTOPADS_300X250 = `
<script>
(function(puycmb){
var d = document,
    s = d.createElement('script'),
    l = d.scripts[d.scripts.length - 1],
    slot = d.currentScript && d.currentScript.parentNode;
s.settings = puycmb || {};
if (slot && slot.nodeType === 1) {
  slot.id = slot.id || 'hilltopads-' + Math.random().toString(36).slice(2, 10);
  s.settings.appendTo = '#' + slot.id;
  delete window.ffd033;
  s.onload = s.onerror = function () {
    var stray = s.nextElementSibling;
    if (stray && stray.querySelector('iframe')) stray.parentNode.removeChild(stray);
    if (s.parentNode) s.parentNode.removeChild(s);
  };
}
s.src = "\/\/untimely-hello.com\/bgX.VvsDd-GalM0\/YSWVcj\/keCm\/9AuDZ\/UmlYkrPKTtY\/5PN\/Dec\/5LNJDXE\/tUNvjHkF0kNezOkm0JNiQm";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})
</script>
`;