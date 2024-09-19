import {Request, Response, NextFunction} from 'express';
import {body , validationResult} from 'express-validator';
import Article, {IArticleModel} from '../models/article';
import async from "async"
import Tag from '../models/tag';
import { CallbackError } from 'mongoose';

const showAllArticles = (req:Request, res:Response, next:NextFunction) => {
    const query = {isPublished:true};
    const options ={
        sort:{timeStamp:-1},
        populate:[
            {path:'author', select:'username'},
            {path:'comments'},
            {path:'tags'},
        ],
    };

    Article.find(query,null, options).exec(
        (err: CallbackError, listArticles:IArticleModel[] | null) => {
            if(err){
                return next();
            }
            if(!listArticles){
                return res.status(404).json({message:'NO articles found'});
            }
            res.status(200).json({
                article_list:listArticles,
            });
        }
    );
};

const showAllArticlesAdmin = (req:Request, res:Response, next:NextFunction)=>{
    const query = {};
    const options ={
        sort:{timeStamp:-1},
        populate:[
            {path:'author', select:'username'},
            {path:'comments'},
            {path:'tags'},
        ],
    };
    Article.find(query, null , options).exec(
        (err:CallbackError, listArticles:IArticleModel[] | null) => {
            if(err){
                return next(err);
            }
            if(!listArticles){
                return res.status(404).json({message:'No articles found'});
            }
            res.status(200).json({
                article_list:listArticles,
            });
        }
    );
};

const showLatestArticles = (req:Request, res:Response , next:NextFunction) =>{
    const articleLimit = 12;
    const query= {isPublished:true};
    const options = {
        sort:{timeStamp:-1},
        limit:articleLimit,
        populate:[
            {path:'author', select:'username'},
            {path:'comments'},
            {path:'tags'},
        ],
    }
    Article.find(query,null, options).exec(
        (err:CallbackError, listArticles:IArticleModel[] |  null) => {
            if(err){
                return next(err);
            }
            if(!listArticles){
                return res.status(404).json({message:'No articles found'});
            }
            res.status(200).json({
                article_list:listArticles,
            });
        }
    );
};

const showCertainArticle = (req:Request , res:Response , next:NextFunction) => {
    const id = req.params.id;
    const options = {
        sort:{timeStamp: -1},
        populate:[
            {path:'author', select:'username'},
            {path:'comments'},
            {path:'tags'},
        ]
    };

    Article.findById(id,null , options).exec(
        (err:CallbackError, article:IArticleModel | null) => {
            if(err){
                return next(err);
            }
            if(!article){
                return res.status(404).json({message:'Article not found'});
            }
            res.status(200).json({
                article,
            });
        }
    );
}   

const getRandomArticleId = (req:Request, res:Response, next:NextFunction) => {
    Article.aggregate([
        {
            $match:{isPublished:true},
        },
        {
            $sample:{size:1},
        }
    ]).exec((err:CallbackError, article: IArticleModel[]) => {
        if(err){
            return next(err);
        }
        if(!article.length){
            res.status(404).json({message:'Nop published articles found'});
        }
        res.status(200).json({
            articleId: article[0]._id,
        });
    });
};

const showUnpublishedArticles = (req:Request, res:Response, next:NextFunction) =>{
    const query = { isPublished: false};
    const options = {
        sort:{timeStamp:-1},
        populate:[
            {path:'author', select:'username'},
            {path:'comments'},
            {path:'tags'},
        ],
    }
    Article.find(query, null, options).exec(
        (err:CallbackError, listArticles:IArticleModel[] | null) => {
            if(err){
                return next(err);
            }
            if(!listArticles){
                return res.status(404).json({message:'No unpublished articles found'});
            }
            res.status(200).json({
                article_list:listArticles,
            });
        }
    )
}

const createArticle = [
    (req: Request, res:Response, next:NextFunction) =>{
        if(!Array.isArray(req.body.tag)){
            req.body.tag = typeof req.body.tag ==='undefined' ? [] :[req.body.tag];
        }
        next();
    },
    body('title', 'Title must not be empty').trim().isLength({min:1}).escape(),
    body('content','Content must not be empty').trim().isLength({min:1}).escape(),
    body('tags.*').escape(),

    (req: Request, res:Response, next:NextFunction) =>{
        const errors = validationResult(req);
        const article = new Article({
            author: req.user,
            title : req.body.title,
            content: req.body.content,
            timestamp: Date.now(),
            tags : typeof req.body.tags === 'undefined' ? [] : [req.body.tags],
            comments:[],
            isPublished: req.body.isPublished,
        });

        if(!errors.isEmpty()){
            async.parallel(
                {
                    tags(callback){
                        Tag.find(callback);
                    },
                },
                (err: Error | undefined , results: async.Dictionary<any>) => {
                    if(err){
                        return next(err);
                    }
                    for(const tag of results.tags){
                        if(article.tags.includes(tag._id)){
                            tag.checked= true;
                        }
                    }
                    res.status(400).json({
                        title:'failed to save article',
                        tags:results.tags,
                        errors:errors.array(),
                        article,
                    });
                }
            );
            return;
        }

        article.save((err)=>{
            if(err){
                return next(err);
            }
            res.status(201).json({
                title:'Article saved successfully',
                article,
            });
        });
    },
];

const updateArticle = [
    (req:Request, res:Response, next: NextFunction) => {
        req.body.tags = Array.isArray(req.body.tags)
            ?req.body.tags : req.body.tags
            ?[req.body.tags]: [];
        req.body.comments = Array.isArray(req.body.comments)
            ?req.body.comments:req.body.comments
            ?[req.body.comments]:[];
        next();
    }, 

    body('title', 'Title must not be empty').trim().isLength({min:1}).escape(),
    body('content','Text must not be empty').trim().isLength({min:1}).escape(),
    body('tags.*').escape(),
    body('comments.*').escape(),

    (req:Request, res:Response, next:NextFunction) => {
        const errors = validationResult(req);
        const reqArticle = new Article({
            _id: req.params.id,
            author: req.body.author,
            title: req.body.title,
            content: req.body.content,
            timestamp: Date.now(),
            tags: req.body.tags ?? [],
            comments: req.body.comments ?? [],
            isPublished: req.body.isPublished === 'on',
        })

        if(!errors.isEmpty()){
            async.parallel(
                {
                    tags(callback){
                        Tag.find(callback);
                    },
                },
                (err: Error | undefined, results: async.Dictionary<any>) => {
                    if(err){
                        return next(err);
                    }
                    for(const tag of results.tags){
                        if(reqArticle.tags.includes(tag._id)){
                            tag.checked= true;
                        }
                    }
                    res.status(400).json({
                        title:'Failed to update article',
                        tags: results.tags,
                        comments:results.comments,
                        errors: errors.array(),
                        article: reqArticle,
                    });
                }
            );
            return ;
        }

        Article.findOne(
            {_id:req.params.id},
            (err:Error, foundArticle:IArticleModel) => {
                if(err){
                    return next(err);
                }

                foundArticle.title = req.body.tile;
                foundArticle.content = req.body.content;
                foundArticle.tags = reqArticle.tags ?? [];
                foundArticle.comments = reqArticle.comments?? [];
                foundArticle.timestamp = foundArticle.isPublished ? foundArticle.timestamp : new Date();
                foundArticle.isPublished = req.body.isPublished === 'on';
                foundArticle.save((err, updatedArticle) => {
                    if(err){
                        return next(err);
                    }
                    res.status(200).json({
                        title:'Article updated successfully',
                        article: updatedArticle,
                    });
                });
            }
        );
    },
];

const deleteArticle = (req:Request, res:Response, next: NextFunction) => {
    Article.findById(req.params.id).exec(function (
        err:CallbackError,
        result:IArticleModel | null
    ){
        if(err){
            return next(err);
        }
        Article.findByIdAndRemove(result?._id,(err: CallbackError) => {
            if(err){
                return next(err);
            }
            res.status(200).json({title:'Article Deleted'})
        });
    });
};

export {
    showAllArticles,
    showAllArticlesAdmin,
    showLatestArticles,
    showCertainArticle,
    getRandomArticleId,
    showUnpublishedArticles,
    createArticle,
    updateArticle,
    deleteArticle
}