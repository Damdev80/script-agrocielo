
  function doGet() {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('WooAdmin PRO')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  function wpGetUrlsFromIds(idsArray) {
    const resultCache = {};
    if (!idsArray || idsArray.length === 0) return resultCache;

    const requests = idsArray.map((id) => ({
      url: `https://agrocielo.alcieloconstructora.com/wp-json/wp/v2/media/${id}`,
      method: 'get',
      muteHttpExceptions: true,
    }));

    const responses = UrlFetchApp.fetchAll(requests);

    responses.forEach((res, index) => {
      const id = idsArray[index];
      if (res.getResponseCode() === 200) {
        try {
          const data = JSON.parse(res.getContentText());
          if (data.source_url) resultCache[id] = data.source_url;
        } catch (e) {}
      }
    });

    return resultCache;
  }

  /**
   * MOTOR DE BÚSQUEDA BLINDADO DE DOBLE PASADA
   */
  function wpGetIdsFromUrls(urlsArray) {
    const resultCache = {};
    if (!urlsArray || urlsArray.length === 0) return resultCache;

    // PASADA 1: Búsqueda exacta por SLUG (Lo más infalible en WordPress)
    const requests = urlsArray.map((url) => {
      let cleanUrl = url.split('?')[0];
      let filename = cleanUrl.split('/').pop();
      let slug = filename.replace(/\.[^/.]+$/, ''); // Quita .jpg, .webp, etc.

      return {
        url: `https://agrocielo.alcieloconstructora.com/wp-json/wp/v2/media?slug=${encodeURIComponent(slug)}`,
        method: 'get',
        muteHttpExceptions: true,
      };
    });

    const responses = UrlFetchApp.fetchAll(requests);

    urlsArray.forEach((url, index) => {
      let res = responses[index];
      if (res.getResponseCode() === 200) {
        try {
          let data = JSON.parse(res.getContentText());
          if (data && data.length > 0) resultCache[url] = data[0].id.toString();
        } catch (e) {}
      }
    });

    // PASADA 2: Búsqueda profunda para las URLs que fallaron
    const fallbackRequests = [];
    const fallbackUrls = [];
    urlsArray.forEach((url) => {
      if (!resultCache[url]) {
        // Si no se encontró en la pasada 1
        let filename = url.split('?')[0].split('/').pop();
        fallbackUrls.push(url);
        fallbackRequests.push({
          url: `https://agrocielo.alcieloconstructora.com/wp-json/wp/v2/media?search=${encodeURIComponent(filename)}`,
          method: 'get',
          muteHttpExceptions: true,
        });
      }
    });

    if (fallbackRequests.length > 0) {
      const fallbackResponses = UrlFetchApp.fetchAll(fallbackRequests);
      fallbackUrls.forEach((url, index) => {
        let res = fallbackResponses[index];
        if (res.getResponseCode() === 200) {
          try {
            let data = JSON.parse(res.getContentText());
            if (data && data.length > 0)
              resultCache[url] = data[0].id.toString();
          } catch (e) {}
        }
      });
    }

    return resultCache;
  }

  function autorizarPermisos() {
    UrlFetchApp.fetch('https://www.google.com');
  }

