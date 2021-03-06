import Url from "url";
import {PmsBufferCallback, PmsBufferRange} from "@cores/types";
import {PmsBufferTree} from "@cores/buffer-tree";
import {PmsRequest} from "@cores/request";
import {PPServerRequest} from "pms-proxy";
import {log} from "@cores/logger";

export abstract class PmsCached {
    protected request: PPServerRequest;
    protected url: Url.UrlWithParsedQuery;
    protected bufferTree: PmsBufferTree;
    protected requestFeatures: PmsRequest[];

    static id = 0;
    id = PmsCached.id++;

    protected constructor() {
        this.bufferTree = new PmsBufferTree();
    }

    abstract loadRanges(ranges: PmsBufferRange[]): Promise<PmsRequest[]>;
    abstract release(): void;

    wait(range: PmsBufferRange, callback: PmsBufferCallback) {
        console.log('----------------')
        console.log(this.request.url);
        console.log('load', this.id);

        if (!this.bufferTree.has(range)) {
            const { start, end } = range;
            const e = end || Math.max(start + 10 * 1024 * 1024, end);
            this.loadRanges(this.bufferTree.getNoDataRanges({ start, end: e }))
                .catch(e => {
                    log.info(e);
                })
            console.log('add waiter');
        } else {
            console.log('no load', this.id);
            console.log(this.debug())
        }
        return this.bufferTree.wait(range, callback);
    }

    setRequest(request: PPServerRequest) {
        this.request = request;
        this.url = Url.parse(request.url, true);
    };

    getUrl() {
        return this.url;
    }

    debug() {
        return this.bufferTree.debug();
    }

    loadFeature() {
        // const offset = this.bufferTree.maxOffset() || 0;
        // console.log('load feature', offset, this.id);
        // const ranges = this.bufferTree.getNoDataRanges({
        //     start: offset,
        //     end: offset + 5 * 1024 * 1024
        // }, false)
        // this.requestFeatures = this.loadRanges(ranges);
    }

    cancelFeature() {
        console.log('aborting...', this.id);
        if (!this.requestFeatures?.length) {
            return;
        }
        console.log('abort', this.requestFeatures.length);
        this.requestFeatures.forEach(req => req.abort());
        this.requestFeatures = [];
    }
}