import { ReactNode, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
//@ts-ignore
import Prism from 'prismjs';
import { useAgentApiAgent, useAgentApiConversationWithMessages, useAgentApiInvokeQuery } from "../../apis/agent-api";
import {  Flex, Loader, Text, View, useTheme } from "@aws-amplify/ui-react";
import { AgentChatMessage, AgentGraphQLBlock, AgentInnerDialogBlock, AgentJSONBlock, AgentPartialChatMessage, GraphQLResultBlock, UserChatMessage } from "./chat-items";
import reactUseCookie from "react-use-cookie";
import { useAgentConversationMetadata } from "../../apis/agent-api/hooks/useMetadata";
import ReactMarkdown from 'react-markdown';

function EnterUserSection () {
    const { tokens } = useTheme();

    return <View padding={10} width="100%" backgroundColor={tokens.colors.brand.primary[10]}>
     <Text textTransform='capitalize' textAlign='center'>        
            You
        </Text>
    </View>
}

function EnterAgentSection (props: {name?: string}) {
    const { tokens } = useTheme();

    return <View padding={10} width="100%" backgroundColor={tokens.colors.brand.primary[10]}>
        <Text textTransform='capitalize' textAlign='center'>        
            {props.name}
        </Text>
    </View>
}

export function ChatRendered () {

    const {chatId} = useParams()
    const conversationMetadata = useAgentConversationMetadata()
    
    const {loadingConversation, events, conversation} = useAgentApiConversationWithMessages(chatId)
    const agentObject = useAgentApiAgent(conversation?.agent)
    const [apiKey] = reactUseCookie(agentObject.value?.actions[0]?.id||'')
    const chatBottomRef = useRef<HTMLDivElement>(null)
    const chatInvokeQuery = useAgentApiInvokeQuery(chatId)
    setTimeout(() => Prism.highlightAll(), 100);
    useEffect(() => chatBottomRef.current?.scrollIntoView(), [events, conversationMetadata])

    if (agentObject.isUnloaded() || !agentObject.value || loadingConversation) {
        return <Loader/>
    }

    

    let lastSection = ''
    let renderedChat: ReactNode[] = []
    let lastEffectEndTime = + new Date(events[0]?.timestamp);
    
    events.forEach((event, index) => {



        if (new Date(event.timestamp).getTime() > lastEffectEndTime) {
            lastEffectEndTime = new Date(event.timestamp).getTime()
        }

        let messageSize = 0;

        if (event.sender === 'user'){
            if (lastSection !== 'user') {
                lastSection = 'user'
                renderedChat.push(<EnterUserSection key={index}/>)
            }

            if (event.event.message) {
                
                renderedChat.push(
                    <UserChatMessage
                        text={event.event.message}
                        event={event}
                        lastEventTime={lastEffectEndTime}
                        key={event.id}
                    />
                )
            }

            if (event.event.actionResult) {
                renderedChat.push(
                    <GraphQLResultBlock 
                        text={event.event.actionResult} 
                        event={event} 
                        lastEventTime={lastEffectEndTime}
                        key={event.id}
                    />
                )
            }
        }
        
        if (event.sender === 'agent'){

            if (lastSection !== 'agent') {
                lastSection = 'agent'
                renderedChat.push(<EnterAgentSection name={agentObject.value?.name} key={index}/>)
            }
             
            if (event.event.message) {

                
                let parts = event.event.message.split('```');
                let localLastEffectTime = lastEffectEndTime;


                parts.forEach((part, idx) => {
                    const isCodeBlock = idx % 2 !== 0;
                    const key = `${event.id}-${idx}`;

                    if (isCodeBlock) {
                        renderedChat.push(
                            <div key={key} style={{ backgroundColor: "#f5f5f5", padding: "10px" }}>
                                <ReactMarkdown>{`\`\`\`${part}\`\`\``}</ReactMarkdown>
                            </div>
                        );
                    } else {
                        renderedChat.push(
                            <AgentChatMessage 
                                text={part}
                                event={event}
                                lastEventTime={localLastEffectTime}
                                key={key}
                            />
                        );
                    }
                });
               
            }

            else if (event.event.actionRequested) {
                if (event.event.actionResult) {
                    renderedChat.push(
                        <GraphQLResultBlock 
                            text={event.event.actionResult} 
                            event={event} 
                            lastEventTime={lastEffectEndTime}
                            key={event.id}/>
                    )
                }
                else if (event.event.actionRequested) {
                    renderedChat.push(
                        <AgentGraphQLBlock 
                            text={event.event.actionRequested} 
                            event={event} 
                            lastEventTime={lastEffectEndTime}
                            invoke={() => {
                                chatInvokeQuery(agentObject.value?.actions[0].resource as string, event.event.actionRequested as string, apiKey)
                            }}
                            key={event.id}/>
                    )
                }
            }

            else if (event.event.innerDialog){
                renderedChat.push(<AgentInnerDialogBlock 
                    text={event.event.innerDialog} 
                    event={event} 
                    lastEventTime={lastEffectEndTime}
                    key={event.id}/>
                )
                messageSize = event.event.innerDialog.length
            }
            
        }
        // Compute delay for typing effect
        lastEffectEndTime += messageSize * 5

    })

    if (conversationMetadata.partialMessage) {
        if (lastSection === 'user') {
            renderedChat.push( <EnterAgentSection name={agentObject.value.name} key="partial-section"/>)
        }
        renderedChat.push(
            <AgentPartialChatMessage text={conversationMetadata.partialMessage} key="partial"/>
        )
    }

    return (
        <View style={{height: 'calc(100vh - 230px)', overflowY: 'scroll'}}>
            <View>
            <Flex
                minHeight='calc(100vh - 220px)'
                direction="column"
                justifyContent="flex-end"
                paddingBlockEnd={20}
                >
                    {renderedChat}                   
                    <div ref={chatBottomRef}/>
                </Flex>
            </View>
        </View>
    )

}
