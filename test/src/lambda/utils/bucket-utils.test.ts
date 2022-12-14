import * as cut from './../../../../src/lambda/utils/bucket-util';

describe('getBucketNameList test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    test('it should return the list of whitelisted buckets if value is not NONE', () => {
        const result = cut.getBucketNameList('bucket-1 , bucket-2 , bucket-3')

        expect(result).toStrictEqual([
            'bucket-1',
            'bucket-2',
            'bucket-3'
        ])
    })

    test('it should return [] if value is NONE', () => {
        expect(cut.getBucketNameList('NONE')).toStrictEqual([])
    })
})

describe('getBucketNameFromArn test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    test('it should return clean bucket name without arn format', () => {
        const result = cut.getBucketNameFromArn('arn:aws:s3:::bucket-1');

        expect(result).toBe('bucket-1')
    })
})