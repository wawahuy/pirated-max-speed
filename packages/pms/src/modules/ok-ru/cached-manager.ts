import {PmsCachedManager} from "@cores/cached-manager";
import {PmsOkRuCached} from "@modules/ok-ru/cached";
import {CompletedRequest} from "mockttp";
import {KeyPair} from "@cores/types";
import Url from "url";

export class PmsOkRuCachedManager extends PmsCachedManager<PmsOkRuCached> {

    protected buildCachedNode(): PmsOkRuCached {
        return new PmsOkRuCached();
    }

    protected makeQueryKey(request: CompletedRequest, url: Url.UrlWithParsedQuery): KeyPair<string> {
        const id = url.query['id'];
        const sig = url.query['sig'];
        const type = url.query['type'];
        return {
            id: String(id),
            sig: String(sig),
            type: String(type)
        };
    }

    protected isRenewCached(cached: PmsOkRuCached, request: CompletedRequest, url: Url.UrlWithParsedQuery): boolean {
        // const queryCached = cached.getUrl().query;
        // const queryUrl = url.query;
        // return queryCached['sig'] != queryUrl['sig'] || queryCached['type'] != queryUrl['type'];
        return false;
    }
}