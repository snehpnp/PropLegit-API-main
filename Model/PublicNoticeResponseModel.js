module.exports = class PublicNoticeResponseModel {
    constructor(
        NoticeResponceID,
        ApplicationNoticeID,
        DocumentPath,
        RespondentName,
        Comments
    ) {
        this.NoticeResponceID = NoticeResponceID;
        this.ApplicationNoticeID = ApplicationNoticeID;
        this.DocumentPath = DocumentPath;
        this.RespondentName = RespondentName;
        this.Comments = Comments;
    }
}