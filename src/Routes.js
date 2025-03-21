import { Bullseye, Spinner } from '@patternfly/react-core';
import { NotAuthorized } from '@redhat-cloud-services/frontend-components/NotAuthorized';
import { usePermissionsWithContext } from '@redhat-cloud-services/frontend-components-utilities/RBACHook';
import AsyncComponent from '@redhat-cloud-services/frontend-components/AsyncComponent';
import axios from 'axios';
import PropTypes from 'prop-types';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { NavigateToSystem } from './Utilities/NavigateToSystem';

const PermissionRoute = ({ requiredPermissions = [] }) => {
    const { hasAccess, isLoading } = usePermissionsWithContext(requiredPermissions);
    if (!isLoading) {
        return hasAccess ? <Outlet /> : <NotAuthorized serviceName="patch" />;
    } else {
        return '';
    }
};

PermissionRoute.propTypes = {
    requiredPermissions: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.string
    ])
};

const Advisories = lazy(() =>
    import(
        /* webpackChunkName: "Advisories" */ './SmartComponents/Advisories/Advisories'
    )
);

const Systems = lazy(() =>
    import(
        /* webpackChunkName: "Systems" */ './SmartComponents/Systems/SystemsPage'
    )
);

const InventoryDetail = lazy(() =>
    import(
        /* webpackChunkName: "InventoryDetail" */ './SmartComponents/SystemDetail/InventoryDetail'
    )
);

const AdvisoryPage = lazy(() =>
    import(
        /* webpackChunkName: "AdvisoryPage" */ './SmartComponents/AdvisoryDetail/AdvisoryDetail'
    )
);

const PackagesPage = lazy(() =>
    import(
        /* webpackChunkName: "Packages" */ './SmartComponents/Packages/Packages'
    )
);

const PackageDetail = lazy(() =>
    import(
        /* webpackChunkName: "PackageDetail" */ './SmartComponents/PackageDetail/PackageDetail'
    )
);

const PatchRoutes = () => {
    const generalPermissions = ['patch:*:*', 'patch:*:read'];
    const [hasSystems, setHasSystems] = useState(true);
    const INVENTORY_TOTAL_FETCH_URL = '/api/inventory/v1/hosts';
    const RHEL_ONLY_FILTER = '?filter[system_profile][operating_system][RHEL][version][gte]=0';

    useEffect(() => {
        try {
            axios
            .get(`${INVENTORY_TOTAL_FETCH_URL}${RHEL_ONLY_FILTER}&page=1&per_page=1`)
            .then(({ data }) => {
                setHasSystems(data.total > 0);
            });
        } catch (e) {
            console.log(e);
        }
    }, [hasSystems]);

    return (
        <Suspense
            fallback={
                <Bullseye>
                    <Spinner />
                </Bullseye>
            }
        >
            <Routes>
                <Route path='/templates' >
                    <Route path='' element={
                        <Navigate relative="route" to={'/insights/content/templates'} replace />
                    } />
                </Route>
                <Route path='*' element={
                    <AsyncComponent
                        appId="content_management_zero_state"
                        module="./AppZeroState"
                        scope="dashboard"
                        ErrorComponent={<div>Error state</div>}
                        app="Content_management"
                        customFetchResults={hasSystems}
                    >
                        <Routes>
                            <Route element={<PermissionRoute requiredPermissions={generalPermissions} />}>
                                <Route path='/advisories' element={<Advisories />} />
                                <Route path='/advisories/:advisoryId/:inventoryId'
                                    element={<NavigateToSystem />} />
                                <Route path='/advisories/:advisoryId' element={<AdvisoryPage />} />
                                <Route path='/systems' element={<Systems />} />
                                <Route path='/systems/:inventoryId' element={<InventoryDetail />} />
                                <Route path='/packages' element={<PackagesPage />} />
                                <Route path='/packages/:packageName' element={<PackageDetail />} />
                                <Route path='/packages/:packageName/:inventoryId'
                                    element={<NavigateToSystem />} />
                                <Route path='*' element={<Navigate to="advisories" />} />
                            </Route>
                        </Routes>

                    </AsyncComponent>
                } />

            </Routes>
        </Suspense>
    );
};

export default PatchRoutes;
