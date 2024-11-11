import React from "react"
import { MouseEventHandler, forwardRef, useEffect, useState } from "react"

export interface IFlexRef {
}

export interface IFlexProps {
    id?: string,
    className?: string,
    style?: React.CSSProperties,
    children?: React.ReactNode,
    onClick?: MouseEventHandler<HTMLDivElement>,
    verticalCenter?: boolean,
    horizontalCenter?: boolean,
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse',
    spacing?: JSX.Element | string | number,
    spacingStart?: JSX.Element | string | number,
    spacingEnd?: JSX.Element | string | number,
}

const Flex = forwardRef<IFlexRef, IFlexProps>((props, ref) => {
    const renderSpacing = (spacing: JSX.Element | string | number | undefined) => {
        if (spacing === undefined) return undefined;
        else if (typeof spacing === 'string' || typeof spacing === 'number') return <span style={{
            width: props.direction === 'row' ? spacing : undefined,
            height: props.direction === 'column' ? spacing : undefined
        }}></span>
        else return React.cloneElement(spacing, {
        })
    }
    const renderChildren = (children: React.ReactNode) => {
        if (props.spacing === undefined) return children;
        else if (children === undefined) return undefined;
        else if (children instanceof Array) {
            let tempChildren = children as React.ReactNode[];
            return tempChildren.map((child, index) => {
                return <React.Fragment key={index}>
                    {index === 0 && props.spacingStart !== undefined ? renderSpacing(props.spacingStart) : undefined}
                    {child}
                    {index < tempChildren.length - 1 ? renderSpacing(props.spacing) : undefined}
                    {index === tempChildren.length - 1 && props.spacingEnd !== undefined ? renderSpacing(props.spacingEnd) : undefined}
                </React.Fragment>
            })
        }
        else return children;
    }
    return <div
        id={props.id}
        className={props.className}
        style={{
            display: 'flex',
            flexDirection: props.direction,
            alignItems: props.verticalCenter ? 'center' : undefined,
            justifyContent: props.horizontalCenter ? 'center' : undefined,
            ...props.style
        }}
        onClick={props.onClick}>
        {renderChildren(props.children)}
    </div>
})

const Vertical = forwardRef<IFlexRef, IFlexProps>((props, ref) => {
    return <Flex ref={ref} {...props} direction='column' />
})

const Horizontal = forwardRef<IFlexRef, IFlexProps>((props, ref) => {
    return <Flex ref={ref} {...props} direction='row' />
})

export { Flex, Vertical, Horizontal }