import React from 'react';

const Menu: React.FC<{hello: string}> = ({hello}) => {
    return(
        <div>
            {hello}
        </div>
    )
}

export default Menu;