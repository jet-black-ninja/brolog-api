import{Request, Response, NextFunction} from "express";
import {body , validationResult} from 'express-validator';

import Tag from '../models/tag'

const showAllTags= async (req:Request, res:Response, next: NextFunction) => {
    try{
        const listTags = await Tag.find({}).sort('tag');
        res.status(200).json({
            tag_list:listTags,
        });
    }catch(err){
        next(err);
    }
};

const createTag = [
    body('tagName', 'Tag Name required').trim().isLength({min:1}).escape(),
    async(req:Request, res:Response, next: NextFunction) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({
                title:'could not create tag',
                errors:errors.array(),
            });
        }

        let tag = await Tag.findOne({name:req.body.tagName});
        if(tag){
            return res.status(400).json({
                title:"Tag already exists",
            })
        }
        tag = new Tag({name:req.body.tagName});
        try{
            await tag.save();
            res.status(201).json({
                title:'Tag saved successfully',
                tag,
            });
        }catch(err){
            next(err);
        }
    },
];

const deleteTag = async(req:Request, res:Response, next: NextFunction) => {
    try{
        const tag = await Tag.findById(req.params.id);
        if(!tag){
            return res.status(404).json({title:'Tag not found'});
        }
        await Tag.findByIdAndRemove(req.params.id);
        res.status(200).json({title:"Tag deleted successfully"})
    }catch(err){
        next(err);
    }
};

const updateTag = [
    body('tagName', 'Tag name required').trim().isLength({min:1}).escape(),
    async(req:Request, res:Response, next:NextFunction) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({
                title:'could not update tag',
                errors:errors.array(),
            });
        }
        const tag = await Tag.findById(req.params.id);
        if(!tag){
            return res.status(404).json({title:'Tag not found'});
        }

        tag.name = req.body.tagName;
        try{
            await tag.save();
            res.status(200).json({
                title:'Tag updated successfully',
                tag,
            });
        }catch(err){
            next(err);
        }
    },
];

export {showAllTags, createTag, deleteTag, updateTag}