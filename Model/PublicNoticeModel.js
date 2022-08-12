module.exports = class PublicNoticeModel {
    constructor(
        AppID,
        NoticeID,
        NewspaperID,
        PublishDate,
        Summary,
        NoticeDays,
        IsPublished
    ) {
        this.AppID = AppID;
        this.NoticeID = NoticeID;
        this.NewspaperID = NewspaperID;
        this.PublishDate = PublishDate;
        this.Summary = Summary;
        this.NoticeDays = NoticeDays;
        this.IsPublished = IsPublished;
    }
}