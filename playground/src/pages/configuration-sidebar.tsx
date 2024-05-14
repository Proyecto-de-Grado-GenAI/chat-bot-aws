import { Navigate, Outlet, useNavigate } from "react-router-dom"
import { Button, Flex, Loader, View, useAuthenticator, Text } from "@aws-amplify/ui-react"
import { Container } from "../library/container"
import { ConfigurationAgentItem } from "../library/control/agent-listed"
import { useAgentApiAgentList } from "../apis/agent-api"
import { enableConfigureAgents } from "../endpoints"

export function ConfigurationPage () {
    
    const agentListObject = useAgentApiAgentList()
    const authControl = useAuthenticator()
    const nav = useNavigate()

    if (agentListObject.isUnloaded() || !agentListObject.value ){
        return <Loader/>
    }

    if (!enableConfigureAgents){
        return <Navigate to={'/chat'} />
    }
    
    const agentsRendered = agentListObject.value.map(agent => 
        <ConfigurationAgentItem agent={agent} key={agent.id}/>
    )


    // Render the root configuration page
    return (
        <Flex>
            <Container heading="Creación de agentes" width="20%">  
                <Container heading="Agents">
                    <Flex direction="column">
                        {agentsRendered}
                    </Flex>
                    <br/>
                    <Button isFullWidth onClick={() => nav("/configuration/agent-new")}>
                        New Agent
                    </Button>
                </Container>
                <Container heading="Authentication">
                    <Flex direction="column">
                        <Text padding={10}>
                            Signed in
                        </Text>
                    </Flex>
                    <br/>
                    <Button isFullWidth onClick={() => authControl.signOut()}>
                        Sign Out
                    </Button>
                </Container>
            </Container>
            <Container heading="Opciones de creación"  width="100%">
                <Outlet/>
            </Container>
        </Flex>
    )
}